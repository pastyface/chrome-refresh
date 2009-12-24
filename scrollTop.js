
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    console.log('content request action:'+request.action+' pos:'+request.pos);
    if (request.action == "getScrollTop"){
    	var pos =  $(window).scrollTop();
        sendResponse({scrollTop: pos});
    }
    else if (request.action == "setScrollTop"){
    	console.log('setScrollTop '+request.pos);
    	if(request.pos && request.pos > 0){
            $(window).scrollTop(request.pos);
    	}
        sendResponse({});
    }
    else {
      sendResponse({});
    }
});

//alert('ready');
chrome.extension.sendRequest({action: "ready"});

