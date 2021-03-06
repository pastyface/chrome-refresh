    var cr = {};
    cr.reloadingTabs = {};
    
    cr.doLogging = true;
    
    cr.isRegistered = function(tabId){
      return cr.reloadingTabs[tabId] !== undefined;
    }
    
    cr.registerTabReload = function(props){
      cr.unregisterTabReload(props.tab);
      if(props.timeout < 1) return;
      
      props.nextUpdate = new Date().getTime() + (props.timeout * 1000);       
      props.intervalID = setInterval('cr.reloadTab('+props.tab.id+')', props.timeout * 1000 );
      cr.reloadingTabs[props.tab.id] = props;
      cr.updateIcon(props.tab.id);
      
      if(props.countdown && !cr.countdownIntervalID){
        cr.countdownIntervalID = setInterval('cr.updateCountdown()', 1000 );
      }
      
      if(props.countdown) cr.updateCountdown(true);
      
      return props;
    }
    
    cr.unregisterTabReload = function(tab){
      var props = cr.reloadingTabs[tab.id];
      if(props){
        clearInterval(props.intervalID);
        delete cr.reloadingTabs[tab.id];
      }
      cr.updateIcon(tab.id);
      
      if(props && props.countdown) {
        chrome.browserAction.setBadgeText({text: '', tabId: tab.id});
      }
      
      return props;
    }
    
    cr.updateIcon = function(tabId){
      if(cr.isRegistered(tabId)){
        chrome.browserAction.setIcon({path:"refresh-on.png", tabId: tabId});
      }
      else {
        chrome.browserAction.setIcon({path:"refresh-off.png", tabId: tabId});
      }
    }
    
    cr.reloadTab = function(tabId){
      var props = cr.reloadingTabs[tabId];
      
      if(!props || !props.tab){
        return;
      }
      
      //read window scroll position
      props.scrollTop = 0;
      chrome.tabs.sendMessage(tabId, {action: "getScrollTop"}, function(response) {
        if(!response || !response.scrollTop){
          console.error('response.scrollTop is missing');
          return;
        }

        console.log('scroll top get response: '+response.scrollTop);
	console.log('props: '+props);
        props.scrollTop = response.scrollTop;
        cr.reloadingTabs[tabId] = props;
      });
      
      // reload page
      chrome.tabs.update(tabId, { url: props.tab.url});
      
      props.nextUpdate = new Date().getTime() + (props.timeout * 1000);
      
      if(props.countdown) cr.updateCountdown(true);
      
      console.log('reloaded win:'+props.tab.windowId+' tab:'+tabId);
    }
    
    cr.loadAllAutos = function(){
      var autosJson = localStorage['autos'];
      if(autosJson){
        return JSON.parse(autosJson);
      }
    }
    
    cr.loadAutos = function(url){
      var autos = cr.loadAllAutos();
      if(autos){
        var props = autos[url];
        
        if(props) console.log('found auto for '+url);
            
        return props;
      }
    }
    
    cr.saveAutos = function(props){
      var autos = cr.loadAllAutos();
      
      if(!autos){
        autos = {};
      }
      
      autos[props.tab.url] = { url: props.tab.url,
                           timeout: props.timeout,
                           stick: props.stick,
                           title: props.tab.title,
                           countdown: props.countdown
                         };
      
      autosJson = JSON.stringify(autos);
      
      localStorage['autos'] = autosJson;
    }
    
    cr.removeAutos = function(url){
      var autos = cr.loadAllAutos();
      
      if(autos){
        delete autos[url];
        
        autosJson = JSON.stringify(autos);
        localStorage['autos'] = autosJson;
      }
    }
    
    cr.log = function(msg){
      if(cr.doLogging){
        var d = new Date();
        console.log(d.getHours() +
              ':' + d.getMinutes() +
              ':' + d.getSeconds() +
              ' ' + msg);
      }
    }
    
    cr.extractDomain = function(url){
      var pattern=/^([a-zA-Z]+:\/\/[a-zA-Z0-9\.]+)/;
      var result = pattern.exec(url);
      if(result){
        return result[1];
      }
    }
    
    cr.updateCountdown = function(force){
      var key;
      for(key in cr.reloadingTabs) {
        if(typeof cr.reloadingTabs[key] !== 'function') {
          var tabId = parseInt(key);
          
          var props = cr.reloadingTabs[tabId];
          if(!props.countdown){
            continue;
          } 
          
          var millis = props.nextUpdate - new Date().getTime();
          var seconds = 0;
          
          if(millis > 0){
            seconds = millis / 1000;
            seconds = seconds.toFixed();
          }
          
          if(seconds >= 60){
            var minutes = seconds/60;
            minutes = minutes.toFixed();
            chrome.browserAction.setBadgeBackgroundColor({color: [0,0,255,255], tabId: tabId});
            chrome.browserAction.setBadgeText({text: ''+minutes, tabId: tabId});
          }
          else {
            if(force || seconds <= 10 || seconds % 10 === 0){
              chrome.browserAction.setBadgeBackgroundColor({color: [255,0,0,255], tabId: tabId});
              chrome.browserAction.setBadgeText({text: ''+seconds, tabId: tabId});
            }
          }
          
        }
      }
    }
    
    // Update the icon when the current tab changes
    chrome.tabs.onSelectionChanged.addListener(function(tabId, selectInfo) {
      cr.updateIcon(tabId);
    });
    
    chrome.tabs.onRemoved.addListener(function(tabId) {
      var props = cr.reloadingTabs[tabId];
      if(props){
        cr.unregisterTabReload(props.tab);
      }
    });
    
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
      var props = cr.reloadingTabs[tabId];
      
      if(!props){
          props = cr.loadAutos(tab.url);
      }
      
      if(!props) return;
      
      if(!props.tab) props.tab = tab;
      
      var tab_stick = props.stick;
      
      if(!tab_stick) tab_stick = localStorage['tab_stick'];
      
      if(!tab_stick) tab_stick = 'url';

      props.stick = tab_stick;
      props.url = tab.url;
      
      switch(tab_stick){
        
        case 'tab':
            cr.registerTabReload(props);
            break;
        case 'site':
            if(cr.extractDomain(props.url) === cr.extractDomain(tab.url)){
              cr.registerTabReload(props);
            }
            else {
              cr.unregisterTabReload(tab);
            }
            break;
        case 'url': // fall through
        default:
            if(props.url === tab.url){
              cr.registerTabReload(props);
            }
            else {
              cr.unregisterTabReload(tab);
            }
        }
    });
    
    chrome.extension.onMessage.addListener(
      function(request, sender, sendResponse) {
        if (request.action == "ready"){
          var props = cr.reloadingTabs[sender.tab.id];

          sendResponse({});

          //restore window scroll position
          if(props && props.scrollTop && props.scrollTop > 0) {
            chrome.tabs.sendMessage(sender.tab.id, {action: "setScrollTop", pos: props.scrollTop});
          }
          
        }
        else {
          sendResponse({});
        }
    });
    
    