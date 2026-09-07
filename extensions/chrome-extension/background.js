chrome.runtime.onInstalled.addListener(() => {
  console.log('SHE-SHIELD Extension installed')
})

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: 'openAnalyzer' })
})
