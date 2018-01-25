//// //// //// //// initalizations //// //// //// //// 

// info

$('#info-box').toggleClass('hidden');


//// //// //// //// file upload //// //// //// ////  

var userFile;
var data;

readFile()

function readFile(){
    data = (function () {
        var json = null;
        $.ajax({
            'async': false,
            'global': false,
            'url': './data/iot.json',
            'dataType': "json",
            'success': function (data) {
                json = data;
            }
        });
        return json;
    })(); 

    userPlot();
}

function userPlot(){
  setTimeout(function(){
    plotData();
    $('#loader').removeClass('ui active dimmer');
    updateInfoBox();
  }, 200);

  hideAndLoad();
}

function hideAndLoad(){
  $('#loader').addClass('ui active dimmer');
}

//// //// //// //// info box //// //// //// //// 

// $('.info.icon')
//   .transition('set looping')
//   .transition('pulse', '1500ms');

function updateInfoBox(){
  // total size
  $('#statsSize').empty();
  $('#statsSize').append(_.size(organized));

  // number clusters
  $('#clusterSize').empty();
  $('#clusterSize').append(_.uniq(organized, Object.keys(data)[3]).length);
  $('#info-box').removeClass('hidden');
}

