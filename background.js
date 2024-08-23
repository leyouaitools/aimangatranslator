// 背景脚本 background.js

let storedToken = '';

// chrome.storage.local.get('isLogin',data=>{
//     if(!data.isLogin){
//         chrome.storage.local.remove('token')
//     }
//     chrome.storage.local.get('token', data => {
//         storedToken = data.token || '';
//         console.log('Stored token on install:', storedToken);
//         fetchFreeTimes();
//         userMessage();
//     });
// })



chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
    
    // 初始化时获取存储的 token 获取用户信息等
    chrome.storage.local.get('token', data => {
        storedToken = data.token || '';
        console.log('Stored token on install:', storedToken);
        fetchFreeTimes();
        userMessage();
    });
    // chrome.storage.local.get('isLogin',data=>{
    //     if(!data.isLogin){
    //         chrome.storage.local.remove('token')
    //     }
    //     chrome.storage.local.get('token', data => {
    //         storedToken = data.token || '';
    //         console.log('Stored token on install:', storedToken);
    //         fetchFreeTimes();
    //         userMessage();
    //     });
    // })

});

// 设置唯一 ID
function setUid() {
    const randomPart = Math.random().toString(36).substring(2, 10);
    const timePart = (new Date()).getTime().toString(36);
    let uid = randomPart + timePart;

    chrome.storage.local.get('loginEventId', data => {
        if (data.loginEventId) {
            uid = data.loginEventId;
        } else {
            chrome.storage.local.set({ 'loginEventId': uid }, () => {
                console.log('User info saved:', uid);
            });
        }
    });

    return uid;
}

// 获取用户次数
function $getremainderTranslateCnt(params) {
    let token = storedToken?`Bearer ${storedToken}`:''
    const url = new URL('https://aimangatranslator.com/api/manga/remainderTranslateCnt/get');
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    return fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': token  // 添加 token 到请求头部
        }
    }).then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Network response was not ok');
        }
    }).catch(error => {
        throw error;
    });
}

// 获取用户信息
function $getUserInfo(params) {
    let token = storedToken?`Bearer ${storedToken}`:''
    const url = new URL('https://aimangatranslator.com/api/user/getUserInfo');
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    return fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': token  // 添加 token 到请求头部
        }
    }).then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Network response was not ok');
        }
    }).catch(error => {
        throw error;
    });
}

// 用户信息处理
function userMessage() {
    console.log('userMessage',storedToken)
    const loginEventId = setUid();
    $getUserInfo({ loginEventId }).then(res => {
        if (res.code === 200) {
            const userInfo = res.data;
            chrome.storage.local.set({ userInfo }, () => {
                console.log('User info saved:', userInfo);
            });
        }
    }).catch(error => {
        console.error('Error fetching user info:', error);
    });
}

// 获取免费翻译次数
function fetchFreeTimes() {
    const clientId = setUid();
    $getremainderTranslateCnt({ clientId }).then(res => {
        if (res.code === 200) {
            const freeTimes = res.data.remainderCnt;
            chrome.storage.local.set({ freeTimes }, () => {
                console.log('Free translation times saved:', freeTimes);
            });
        }
    }).catch(error => {
        console.error('Error fetching translation count:', error);
    });
}

// 提交图片数据
async function  postImgList(list){
    try {
        const response = await fetch('https://aimangatranslator.com/api/manga/save/imagesByBase64', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(list),
        })
        const data = await response.json()
        console.log(data)
        return data

    } catch (error) {
        console.error('Error posting image list:', error);
        throw error;
    }
}

// 提交翻译前所有数据发送
async function translateTask(postData,sign){
    let token = storedToken?`Bearer ${storedToken}`:''
    try {
        const response = await fetch('https://aimangatranslator.com/api/manga/submit/translateTask', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'sign':sign,
              'Authorization': token  // 添加 token 到请求头部
            },
            body: JSON.stringify(postData)
        })
        const data = await response.json()
        console.log(data)
        return data
    } catch (error) {
        console.error('Error posting image list:', error);
        throw error;
    }  
}


// 定时器 轮询时准备
let intervals = {}
function startInterval(id,interval,callback){
    if(interval[id]){
        clearInterval(intervals[id])
    }

    interval[id] = setInterval(callback,interval)
}

// 取消定时器
function cancelInterval(id) {
    // 如果定时器存在，则清除它并删除ID
    if ( intervals[id]) {
        clearInterval( intervals[id]);
        delete  intervals[id];
    }
}
// 轮询翻译数据
async function translateResult(postData,sign){
    let token = storedToken?`Bearer ${storedToken}`:''
    try {
        const response = await fetch('https://aimangatranslator.com/api/manga/get/translateResult', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'sign':sign,
              'Authorization': token  // 添加 token 到请求头部
            },
            body: JSON.stringify(postData)
        })
        const data = await response.json()
        console.log(data)
        return data
    } catch (error) {
        console.error('Error posting image list:', error);
        throw error;
    } 
}


//接口获取信息  存到storage   再处理消息传递
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 提交后台时postImgList  存下响应数据 imgName是页面上的 imgServerName是数据库的
    // var postImgListRes = []


    if (message.action === 'getFreeTimes') {
        chrome.storage.local.get('freeTimes', data => {
            sendResponse({ 'freeTimes': data.freeTimes });
        });
        return true;  // 需要返回 true 以表明响应是异步的
    } else if (message.action === 'storeToken') {
        chrome.storage.local.get('token', data => {
            storedToken = data.token || '';
        })
        if(!storedToken){
            storedToken = message.token;
            chrome.storage.local.set({ token: message.token }, () => {
                console.log('Token stored:', message.token);
            });
        }
        sendResponse({ 'token': storedToken });
        fetchFreeTimes();
        userMessage();
        return true;  // 需要返回 true 以表明响应是异步的
    } else if (message.action === 'userInfo') {
        chrome.storage.local.get('userInfo', data => {
            sendResponse({ 'userInfo': data.userInfo });
        });
        return true;  // 需要返回 true 以表明响应是异步的
    } else if (message.action === 'isLogin') {
        chrome.storage.local.set({"isLogin":message.data});
        chrome.storage.local.get('token', data => {
            storedToken = data.token || '';
        });
        return true;  // 需要返回 true 以表明响应是异步的
    } else if (message.action === 'FloatingBall'){
        console.log('44444',message.data)
        postImgList(message.data).then(item =>{
            // postImgListRes = [...item.data]
            // console.log('postImgListRes',postImgListRes)
            console.log('postImgListResItem',item)
            sendResponse({'data':item });
        }).catch(()=>{
            sendResponse({'data':[]})
        })
        return true
    }else if(message.action == 'translateTask'){
        // 存储翻以前数据
        let oldImgList = []
        // 存储翻译后接口回来的数据
        let responseImgList = []


        console.log('translateTask',message.data)
        translateTask(message.data.getData,message.data.sign).then(res=>{
            oldImgList = [...message.data.getData.mangaImageInfoList]
            console.log('oldImgList',oldImgList)

            // 提交成功后发送翻译轮询接口
            if(res.code == 200){
                let timerId = setInterval(()=>{
                    if(oldImgList.length == responseImgList.length){
                        sendResponse({"data":responseImgList,"code":200})
                        clearInterval(timerId)
                    }
                    translateResult(message.data.getData,message.data.sign).then(resRe =>{
                        if(resRe.code == 200){
                            if(resRe.data.length > 0){
                                responseImgList = [...responseImgList,...resRe.data]
                                console.log('responseImgList',responseImgList)
                            }
                        }
                    })
                },2000)
            }else{
                sendResponse({"data":[],"code":res.code})
            }
        })
        return true
    }
    return true;
});
