enhancedDomReady(function(){
    $('#slider1').makeSlider('firstLast', 185); // enable pacing slider
});


$(document).ready(function() {  
  
    chrome.tabs.getSelected(window.id, function(tab){
      
      var cr = chrome.extension.getBackgroundPage().cr;
      if(cr.isRegistered(tab.id)){
        $('#start').html('Update');
        
        // try to use values from existing refresh
        var props = cr.reloadingTabs[tab.id];
        var timeout = props.timeout;
        var stick = props.stick;
        var countdown = props.countdown;
      }
      
      // try to read autos value
      var autos = cr.loadAutos(tab.url);
      if(autos){
        $('#auto').attr('checked', true);
        
        if(!timeout) timeout = autos.timeout;
        if(!stick) stick = autos.stick;
        if(!countdown) countdown = autos.countdown;
      }
      
      // try to read options value
      if(!timeout) timeout = localStorage['default_delay'];
      if(!stick) stick = localStorage['tab_stick'];
      if(!countdown) countdown = localStorage['countdown'];
      
      // otherwise use defaults
      if(!timeout) timeout = 60;
      if(!stick) stick = 'url';
      
      // update the form
      var delay = $('#delay');
      delay.val(timeout);
  
      $('input[@name=stick]').each(function() {
        if($(this).val() === stick) {
          $(this).attr('checked', 'checked');
        }
      });
      
      if(stick !== 'url'){
        setAutoable(false);
      }
      
      if(countdown){
        $('#countdown').attr('checked', true);
      }
      else{
        $('#countdown').removeAttr('checked');
      }
    });

    $('#r1').click(function(){
        setAutoable(true);
    });
    $('#r2').click(function(){
        setAutoable(false);
    });
    $('#r3').click(function(){
        setAutoable(false);
    });
    $('#stop').click(stop);
    $('#start').click(start);
  });
  
  function start() {
    chrome.tabs.getSelected(window.id, function(tab){
      var cr = chrome.extension.getBackgroundPage().cr;
      
      var selection = parseInt($('#delay').val());
      var stick = $('input[@name=stick]:checked').val();
      var countdown = $('#countdown').attr('checked') ? true : false;
      
      var props = { tab: tab, 
                      timeout: selection, 
                      countdown: countdown,
                      stick: stick
                    };
  
      props = cr.registerTabReload(props);
      
      if($('#auto').attr('checked')){
        cr.saveAutos(props);
      }
      else{
        cr.removeAutos(props.url);
      }
    });
    window.close();
  }
  
  function stop() {
    chrome.tabs.getSelected(window.id, function(tab){
      var cr = chrome.extension.getBackgroundPage().cr;
      var props = cr.unregisterTabReload(tab);
      
      if(props && !($('#auto').attr('checked'))){
        cr.removeAutos(props.url);
      }
    });
    window.close();
  }
  
  function setAutoable(isAuto){
    if(isAuto){
      $('#auto').removeAttr('disabled'); 
      $('#label-auto').removeClass('disabled'); 
    }
    else {
      $('#auto').attr('disabled', true); 
      $('#auto').removeAttr('checked');
      $('#label-auto').addClass('disabled'); 
    }
  }