"""
Deepfake Detection Training Script
Trains a robust model for detecting AI-generated vs real images
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
import torchvision.models as models
from tqdm import tqdm
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


class DeepfakeCNN(nn.Module):
    """Custom CNN for Deepfake Detection"""
    def __init__(self, num_classes=2):
        super(DeepfakeCNN, self).__init__()
        
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
            
            nn.Conv2d(32, 64, 3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
            
            nn.Conv2d(64, 128, 3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
            
            nn.Conv2d(128, 256, 3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
            
            nn.Conv2d(256, 512, 3, padding=1),
            nn.BatchNorm2d(512),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d(1),
        )
        
        self.classifier = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 64),
            nn.ReLU(),
            nn.Linear(64, num_classes)
        )
    
    def forward(self, x):
        x = self.features(x)
        x = x.view(x.size(0), -1)
        x = self.classifier(x)
        return x


class TransferLearningModel(nn.Module):
    """EfficientNet-based transfer learning model"""
    def __init__(self, num_classes=2):
        super(TransferLearningModel, self).__init__()
        
        self.backbone = models.efficientnet_b0(weights='IMAGENET1K_V1')
        in_features = self.backbone.classifier[1].in_features
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(0.4),
            nn.Linear(in_features, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, 128),
            nn.ReLU(),
            nn.Linear(128, num_classes)
        )
    
    def forward(self, x):
        return self.backbone(x)


class DeepfakeDataset(Dataset):
    """
    Generates synthetic deepfake patterns for training
    Creates distinguishable patterns between real and AI-generated images
    """
    
    def __init__(self, num_samples=3000, img_size=224, train=True):
        self.num_samples = num_samples
        self.img_size = img_size
        self.train = train
        self.rng = np.random.RandomState(42)
    
    def _create_real_image(self):
        """Create realistic photo patterns - high noise, sharp edges, natural variation"""
        img = np.zeros((self.img_size, self.img_size, 3), dtype=np.uint8)
        
        base_hue = self.rng.randint(0, 180)
        for c in range(3):
            base = (base_hue + self.rng.randint(-30, 30)) % 256
            noise = self.rng.normal(0, 40, (self.img_size, self.img_size))
            img[:, :, c] = np.clip(base + noise, 0, 255).astype(np.uint8)
        
        num_objects = self.rng.randint(8, 20)
        for _ in range(num_objects):
            obj_type = self.rng.randint(0, 3)
            x, y = self.rng.randint(10, self.img_size - 40, 2)
            
            if obj_type == 0:
                r = self.rng.randint(10, 40)
                color = tuple(self.rng.randint(50, 220, 3).tolist())
                cv2.circle(img, (x, y), r, color, -1)
            elif obj_type == 1:
                pts = np.array([
                    [x, y],
                    [x + self.rng.randint(20, 50), y],
                    [x + self.rng.randint(10, 30), y + self.rng.randint(20, 50)]
                ], np.int32)
                color = tuple(self.rng.randint(50, 220, 3).tolist())
                cv2.fillPoly(img, [pts], color)
            else:
                w, h = self.rng.randint(15, 50), self.rng.randint(15, 50)
                color = tuple(self.rng.randint(50, 220, 3).tolist())
                cv2.rectangle(img, (x, y), (x + w, y + h), color, -1)
        
        kernel_size = self.rng.choice([3, 5, 7])
        blur_amount = self.rng.uniform(0.5, 1.5)
        img = cv2.GaussianBlur(img, (kernel_size, kernel_size), blur_amount)
        
        noise = self.rng.normal(0, 20, img.shape).astype(np.float32)
        img = np.clip(img.astype(np.float32) + noise, 0, 255).astype(np.uint8)
        
        return img
    
    def _create_ai_image(self):
        """Create AI-generated image patterns - smooth, uniform, artifact-heavy"""
        img_type = self.rng.randint(0, 5)
        
        if img_type == 0:
            base_val = self.rng.randint(100, 180)
            img = np.ones((self.img_size, self.img_size, 3), dtype=np.uint8) * base_val
            
            num_patches = self.rng.randint(15, 35)
            for _ in range(num_patches):
                x, y = self.rng.randint(0, self.img_size - 20, 2)
                w, h = self.rng.randint(5, 25), self.rng.randint(5, 25)
                color = tuple(self.rng.randint(80, 220, 3).tolist())
                cv2.rectangle(img, (x, y), (x + w, y + h), color, -1)
            
            kernel = self.rng.choice([7, 9, 11])
            img = cv2.GaussianBlur(img, (kernel, kernel), 4)
            
        elif img_type == 1:
            base_val = self.rng.randint(120, 200)
            img = np.ones((self.img_size, self.img_size, 3), dtype=np.float32) * base_val
            
            for c in range(3):
                for i in range(0, self.img_size, 8):
                    for j in range(0, self.img_size, 8):
                        noise_val = self.rng.normal(0, 15)
                        img[i:i+8, j:j+8, c] += noise_val
            
            img = np.clip(img, 0, 255).astype(np.uint8)
            
        elif img_type == 2:
            img = self.rng.randint(60, 200, (self.img_size, self.img_size, 3), dtype=np.uint8)
            
            kernel = self.rng.choice([9, 11, 13])
            img = cv2.GaussianBlur(img, (kernel, kernel), 3)
            
            num_lines = self.rng.randint(5, 12)
            for _ in range(num_lines):
                y = self.rng.randint(0, self.img_size)
                thickness = self.rng.randint(3, 10)
                color = tuple(self.rng.randint(40, 220, 3).tolist())
                cv2.line(img, (0, y), (self.img_size, y), color, thickness)
            
        elif img_type == 3:
            center_x, center_y = self.img_size // 2, self.img_size // 2
            radius = self.rng.randint(30, 80)
            
            base_color = self.rng.randint(100, 180, 3)
            for i in range(self.img_size):
                for j in range(self.img_size):
                    dist = np.sqrt((i - center_x)**2 + (j - center_y)**2)
                    if dist < radius:
                        fade = 1.0 - (dist / radius) * 0.3
                        img[i, j] = (base_color * fade).astype(np.uint8)
            img = cv2.GaussianBlur(img, (7, 7), 2)
            
        else:
            base_color = self.rng.randint(80, 200, 3)
            img = np.ones((self.img_size, self.img_size, 3), dtype=np.uint8) * base_color
            
            noise = self.rng.normal(0, 5, img.shape).astype(np.float32)
            img = np.clip(img.astype(np.float32) + noise, 0, 255).astype(np.uint8)
            
            kernel = self.rng.choice([7, 9])
            img = cv2.GaussianBlur(img, (kernel, kernel), 2)
        
        return img
    
    def __len__(self):
        return self.num_samples
    
    def __getitem__(self, idx):
        is_ai = (idx % 2 == 1)
        
        if is_ai:
            img = self._create_ai_image()
            label = 1
        else:
            img = self._create_real_image()
            label = 0
        
        img = Image.fromarray(img)
        
        if self.train:
            transform = transforms.Compose([
                transforms.RandomHorizontalFlip(p=0.5),
                transforms.RandomRotation(20),
                transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2, hue=0.1),
                transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), scale=(0.9, 1.1)),
                transforms.RandomPerspective(distortion_scale=0.2, p=0.3),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ])
        else:
            transform = transforms.Compose([
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ])
        
        return transform(img), torch.tensor(label, dtype=torch.long)


def train_model(model, train_loader, val_loader, epochs, device, save_path):
    """Train the deepfake detection model"""
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=0.001, weight_decay=0.01)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)
    
    best_val_acc = 0.0
    
    print(f"\nTraining on {device}...")
    print(f"Epochs: {epochs}, Train samples: {len(train_loader.dataset)}, Val samples: {len(val_loader.dataset)}\n")
    
    for epoch in range(epochs):
        model.train()
        train_loss = 0.0
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
            
            train_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
            pbar.set_postfix({
                'loss': f'{train_loss/(pbar.n+1):.4f}',
                'acc': f'{100.*correct/total:.1f}%'
            })
        
        scheduler.step()
        
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
        
        train_acc = 100. * correct / total
        val_acc = 100. * val_correct / val_total
        
        print(f'Epoch {epoch+1}: Train Acc={train_acc:.2f}%, Val Acc={val_acc:.2f}%')
        
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'val_acc': val_acc,
                'train_acc': train_acc,
            }, save_path)
            print(f'  -> Best model saved! (Val Acc: {val_acc:.2f}%)\n')
    
    return best_val_acc


def main():
    parser = argparse.ArgumentParser(description='Train Deepfake Detection Model')
    parser.add_argument('--epochs', type=int, default=20)
    parser.add_argument('--batch_size', type=int, default=32)
    parser.add_argument('--num_samples', type=int, default=3000)
    parser.add_argument('--model_type', type=str, default='cnn', choices=['cnn', 'transfer'])
    parser.add_argument('--save_model', type=str, default='../models/deepfake_detector.pth')
    args = parser.parse_args()
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f'\n{"="*60}')
    print('DEEPFAKE DETECTION MODEL TRAINING')
    print(f'{"="*60}')
    print(f'Device: {device}')
    print(f'Model Type: {args.model_type}')
    print(f'Epochs: {args.epochs}')
    print(f'Batch Size: {args.batch_size}')
    print(f'Training Samples: {args.num_samples}')
    print(f'{"="*60}\n')
    
    train_samples = int(args.num_samples * 0.8)
    val_samples = int(args.num_samples * 0.2)
    
    print('Creating datasets...')
    train_dataset = DeepfakeDataset(train_samples, train=True)
    val_dataset = DeepfakeDataset(val_samples, train=False)
    
    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size, shuffle=False, num_workers=0)
    
    print(f'Train: {len(train_dataset)}, Val: {len(val_dataset)}\n')
    
    if args.model_type == 'transfer':
        model = TransferLearningModel()
    else:
        model = DeepfakeCNN()
    
    model = model.to(device)
    
    Path(args.save_model).parent.mkdir(parents=True, exist_ok=True)
    
    print(f'Training for {args.epochs} epochs...\n')
    best_acc = train_model(model, train_loader, val_loader, args.epochs, device, args.save_model)
    
    print(f'\n{"="*60}')
    print(f'Training Complete!')
    print(f'Best Validation Accuracy: {best_acc:.2f}%')
    print(f'Model saved to: {args.save_model}')
    print(f'{"="*60}')


if __name__ == '__main__':
    main()
