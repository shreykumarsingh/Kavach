"""
Deepfake Detection Model Training Script
Trains a CNN model to detect deepfake/AI-generated images

Usage:
    python train_deepfake_model.py --epochs 50 --batch_size 32 --save_model ./models/trained_deepfake.pth
"""

import os
import sys
import argparse
import numpy as np
import cv2
from PIL import Image
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as transforms
from tqdm import tqdm

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from models.deepfake_model import DeepfakeCNN, DeepfakeResNet, get_model, save_model


class SyntheticDeepfakeDataset(Dataset):
    """
    Generates synthetic training data that mimics real vs deepfake patterns.
    Uses frequency analysis, noise patterns, and texture features.
    """
    
    def __init__(self, num_samples=5000, img_size=224, train=True):
        self.num_samples = num_samples
        self.img_size = img_size
        self.train = train
        self.samples = []
        
        np.random.seed(42 if train else 123)
        
        for i in range(num_samples):
            label = i % 2
            self.samples.append(self._generate_sample(label))
    
    def _generate_sample(self, label):
        if label == 0:
            return self._generate_real_image()
        else:
            return self._generate_fake_image()
    
    def _generate_real_image(self):
        img = np.random.randint(50, 200, (self.img_size, self.img_size, 3), dtype=np.uint8)
        
        num_shapes = np.random.randint(3, 8)
        for _ in range(num_shapes):
            x, y = np.random.randint(0, self.img_size, 2)
            radius = np.random.randint(10, 40)
            color = tuple(np.random.randint(0, 255, 3).tolist())
            cv2.circle(img, (x, y), radius, color, -1)
        
        kernel_size = np.random.choice([3, 5, 7])
        img = cv2.GaussianBlur(img, (kernel_size, kernel_size), 0)
        
        noise = np.random.normal(0, 15, img.shape).astype(np.float32)
        img = np.clip(img.astype(np.float32) + noise, 0, 255).astype(np.uint8)
        
        return {'image': img, 'label': 0}
    
    def _generate_fake_image(self):
        noise_type = np.random.choice(['smooth', 'uniform', 'gan_like', 'artifact'])
        
        if noise_type == 'smooth':
            img = np.ones((self.img_size, self.img_size, 3), dtype=np.uint8) * 180
            num_patches = np.random.randint(5, 15)
            for _ in range(num_patches):
                x, y = np.random.randint(0, self.img_size-20, 2)
                w, h = np.random.randint(10, 30, 2)
                color = tuple(np.random.randint(100, 220, 3).tolist())
                cv2.rectangle(img, (x, y), (x+w, y+h), color, -1)
            img = cv2.GaussianBlur(img, (5, 5), 2)
            
        elif noise_type == 'uniform':
            img = np.ones((self.img_size, self.img_size, 3), dtype=np.uint8) * 200
            noise = np.random.normal(0, 5, img.shape).astype(np.float32)
            img = np.clip(img.astype(np.float32) + noise, 0, 255).astype(np.uint8)
            
        elif noise_type == 'gan_like':
            base_val = np.random.randint(120, 180)
            img = np.ones((self.img_size, self.img_size, 3), dtype=np.float32) * base_val
            freq_noise = np.random.uniform(-20, 20, img.shape).astype(np.float32)
            img = img + freq_noise
            img = np.clip(img, 0, 255).astype(np.uint8)
            
        else:
            img = np.random.randint(100, 180, (self.img_size, self.img_size, 3), dtype=np.uint8)
            kernel = np.random.randint(3, 7)
            if kernel % 2 == 0:
                kernel += 1
            img = cv2.GaussianBlur(img, (kernel, kernel), 0)
            artifacts = np.random.randint(0, 2)
            if artifacts:
                x, y = np.random.randint(10, self.img_size-10, 2)
                w, h = np.random.randint(5, 15, 2)
                cv2.rectangle(img, (x, y), (x+w, y+h), (255, 255, 255), -1)
        
        return {'image': img, 'label': 1}
    
    def __len__(self):
        return self.num_samples
    
    def __getitem__(self, idx):
        sample = self.samples[idx]
        img = Image.fromarray(sample['image'])
        label = sample['label']
        
        if self.train:
            transform = transforms.Compose([
                transforms.RandomHorizontalFlip(),
                transforms.RandomRotation(15),
                transforms.ColorJitter(brightness=0.2, contrast=0.2),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ])
        else:
            transform = transforms.Compose([
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ])
        
        return transform(img), torch.tensor(label, dtype=torch.long)


def extract_features_batch(images, labels):
    """Extract handcrafted features for validation"""
    features = []
    for i, (img, label) in enumerate(zip(images, labels)):
        img_np = (img.permute(1, 2, 0).numpy() * 255).astype(np.uint8)
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
        
        lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        noise = gray - cv2.GaussianBlur(gray, (5, 5), 0)
        noise_std = np.std(noise)
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / edges.size
        
        features.append({
            'sharpness': lap_var,
            'noise': noise_std,
            'edges': edge_density,
            'label': label.item()
        })
    return features


def train_model(model, train_loader, val_loader, epochs, device, save_path):
    """Train the deepfake detection model"""
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=20, gamma=0.5)
    
    best_val_acc = 0.0
    train_losses, val_losses = [], []
    train_accs, val_accs = [], []
    
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        pbar = tqdm(train_loader, desc=f'Epoch {epoch+1}/{epochs}')
        for images, labels in pbar:
            images, labels = images.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
            pbar.set_postfix({
                'loss': f'{running_loss/len(train_loader):.4f}',
                'acc': f'{100.*correct/total:.2f}%'
            })
        
        scheduler.step()
        
        train_loss = running_loss / len(train_loader)
        train_acc = 100. * correct / total
        train_losses.append(train_loss)
        train_accs.append(train_acc)
        
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item()
                _, predicted = outputs.max(1)
                val_total += labels.size(0)
                val_correct += predicted.eq(labels).sum().item()
        
        val_loss = val_loss / len(val_loader)
        val_acc = 100. * val_correct / val_total
        val_losses.append(val_loss)
        val_accs.append(val_acc)
        
        print(f'Epoch {epoch+1}: Train Loss={train_loss:.4f}, Train Acc={train_acc:.2f}%, '
              f'Val Loss={val_loss:.4f}, Val Acc={val_acc:.2f}%')
        
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            save_model(model, save_path)
            print(f'  -> New best model saved! (Acc: {val_acc:.2f}%)')
    
    return {
        'train_losses': train_losses,
        'val_losses': val_losses,
        'train_accs': train_accs,
        'val_accs': val_accs,
        'best_val_acc': best_val_acc
    }


def test_model(model, test_loader, device):
    """Test the trained model"""
    model.eval()
    correct = 0
    total = 0
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        for images, labels in test_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            _, predicted = outputs.max(1)
            
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
    
    accuracy = 100. * correct / total
    print(f'\nTest Accuracy: {accuracy:.2f}%')
    
    from sklearn.metrics import classification_report, confusion_matrix
    print('\nClassification Report:')
    print(classification_report(all_labels, all_preds, target_names=['Real', 'Deepfake']))
    
    print('\nConfusion Matrix:')
    print(confusion_matrix(all_labels, all_preds))
    
    return accuracy


def main():
    parser = argparse.ArgumentParser(description='Train Deepfake Detection Model')
    parser.add_argument('--epochs', type=int, default=50, help='Number of training epochs')
    parser.add_argument('--batch_size', type=int, default=32, help='Batch size')
    parser.add_argument('--num_samples', type=int, default=5000, help='Number of synthetic samples')
    parser.add_argument('--img_size', type=int, default=224, help='Image size')
    parser.add_argument('--model_type', type=str, default='resnet', choices=['cnn', 'resnet'], 
                        help='Model architecture')
    parser.add_argument('--save_model', type=str, default='./models/trained_deepfake.pth', 
                        help='Path to save trained model')
    parser.add_argument('--load_model', type=str, default=None, 
                        help='Path to load pretrained model')
    args = parser.parse_args()
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f'Using device: {device}')
    
    print(f'\nGenerating synthetic dataset with {args.num_samples} samples...')
    print('This mimics patterns found in real vs AI-generated images.\n')
    
    train_dataset = SyntheticDeepfakeDataset(
        num_samples=int(args.num_samples * 0.7), 
        img_size=args.img_size, 
        train=True
    )
    val_dataset = SyntheticDeepfakeDataset(
        num_samples=int(args.num_samples * 0.15), 
        img_size=args.img_size, 
        train=False
    )
    test_dataset = SyntheticDeepfakeDataset(
        num_samples=int(args.num_samples * 0.15), 
        img_size=args.img_size, 
        train=False
    )
    
    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size, shuffle=False, num_workers=2)
    test_loader = DataLoader(test_dataset, batch_size=args.batch_size, shuffle=False, num_workers=2)
    
    print(f'Dataset sizes - Train: {len(train_dataset)}, Val: {len(val_dataset)}, Test: {len(test_dataset)}')
    
    if args.load_model:
        print(f'\nLoading pretrained model from {args.load_model}...')
        model = torch.load(args.load_model, map_location=device)
    else:
        print(f'\nInitializing {args.model_type.upper()} model...')
        model = get_model(model_type=args.model_type)
    
    model = model.to(device)
    
    os.makedirs(os.path.dirname(args.save_model) or '.', exist_ok=True)
    
    print(f'\nStarting training for {args.epochs} epochs...\n')
    history = train_model(model, train_loader, val_loader, args.epochs, device, args.save_model)
    
    print(f'\nTraining complete! Best validation accuracy: {history["best_val_acc"]:.2f}%')
    
    print('\nLoading best model for testing...')
    model = torch.load(args.save_model, map_location=device)
    model = model.to(device)
    
    print('\n' + '='*50)
    print('TESTING RESULTS')
    print('='*50)
    test_accuracy = test_model(model, test_loader, device)
    
    print('\nModel saved to:', args.save_model)
    print('Done!')


if __name__ == '__main__':
    main()
