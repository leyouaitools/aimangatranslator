// 内容脚本 content.js

// 从 localStorage 中获取 token
const token = localStorage.getItem('token');
console.log('token-content',JSON.parse(JSON.stringify(token)))
// 如果 token 存在，则发送到背景脚本
if (token) {
  chrome.runtime.sendMessage({ action: 'storeToken', token: JSON.parse(token) });
  chrome.runtime.sendMessage({ action: 'isLogin', data: true });
} else {
  console.log('No token found in localStorage');
  chrome.storage.local.remove('token')
  chrome.runtime.sendMessage({ action: 'storeToken', token: '' });
  chrome.runtime.sendMessage({ action: 'isLogin', data: false });
}
