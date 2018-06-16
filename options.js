
var options = { 'tab_stick': 'stick',
                'default_delay': 'delay',
                'countdown': 'countdown'
              };

// Restores select box state to saved value from localStorage.
function restore_options() {
  eachOption(restore_option);
  
  displayAutos();
}

// Saves options to localStorage.
function save_options() {
  eachOption(save_option);
  
  // Update status to let user know options were saved.
  var status = document.getElementById('status');
  status.innerHTML = 'Options Saved.';
  setTimeout(function() {
    status.innerHTML = '';
  }, 750);
}

function save_option(storageKey, elementId){
  var element = document.getElementById(elementId);
  var type = element.constructor.name;
  
  if(type === 'HTMLSelectElement'){
    var value = element.children[element.selectedIndex].value;
    
  }
  else if(type === 'HTMLInputElement'){
    if(element.type === 'checkbox'){
      var value = $(element).attr('checked');
    }
    else {
      var value = $(element).val();
    }
  }
  
  if(value){
    localStorage[storageKey] = value;
  }
  else {
    delete localStorage[storageKey]; 
  }
}

function restore_option(storageKey, elementId){
  var value = localStorage[storageKey];
  if (!value) {
    return;
  }
  
  var element = document.getElementById(elementId);
  var type = element.constructor.name;
  
  if(type === 'HTMLSelectElement'){
    for (var i = 0; i < element.children.length; i++) {
      var child = element.children[i];
      if (child.value == value) {
        child.selected = 'true';
        break;
      }
    }
  }
  else if(type === 'HTMLInputElement'){
    if(element.type === 'checkbox'){
      if(value){
        $(element).attr('checked', 'checked');
      }
      else {
        $(element).removeAttr('checked');
      }
    }
    else {
      $(element).val(value);
    }
  }
}

function eachOption(func){
  var key;
  for(key in options) {
    if(typeof options[key] !== 'function') {
      func(key, options[key]);
    }
  }
}

function displayAutos(){
  var cr = chrome.extension.getBackgroundPage().cr;
  var autos = cr.loadAllAutos();
  
  var autoCount = 0;
  var content = '<table class="table"><tr><th width="20"></th>' +
                           '<th>Title</th>' +
                           '<th>URL</th>' +
                           '<th align="center">Delay</th>' +
                           '</tr>';
  
  for(key in autos) {
    if(typeof autos[key] !== 'function') {
      var props = autos[key];
      var row = '<tr class="autos"><td><span class="glyphicon glyphicon-remove-circle remove clickable" id="deleteAuto_'+autoCount+'"></span>'+
                '</td><td>' + props.title +
                '</td><td><a href="'+props.url+'">' + props.url +'</a>'+
                '</td><td align="center">' + props.timeout +
                '</td></tr>';
      content += row;
      autoCount++;
    }
  }
  
  content += '</table>';
  
  if(autoCount > 0){
    $('#autos').html(content);
  }
  else {
    $('#autos').html('<em>none</em>');
  }

  autoCount = 0;
  for(key in autos) {
    if(typeof autos[key] !== 'function') {
      var props = autos[key];
      $('#deleteAuto_'+autoCount).click(function(){
        deleteAuto(props.url);
      });
      autoCount++;
    }
  }
}

function deleteAuto(url){
  var prompt = 'Stop automatically refreshing '+url;
  if(confirm(prompt)){
    var cr = chrome.extension.getBackgroundPage().cr;
    cr.removeAutos(url);
    displayAutos();
  }
}



$(function() {
  restore_options();
  $('#save_options').click(save_options);
});