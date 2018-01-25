/*
 * Dreda4Cardboard
 *
 */

// globals
var scene, camera, renderer, effect, controls, stats;
var canvas = document.getElementById('data-canvas');

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

// custom globals for data
var data;
var organized = [];
var grouped;
var groupedSize;
var groupedKeys;

// ratios
var edge = 500;
var pointToEdgeRatio = .05;
var edgePaddingMultiplier = 1.3;
var lineToEdgeRatio = .002;
var lineGapToEdgeRatio = .002;
var lineDashToEdgeRatio = .006;

// camera ratios
var cameraYToEdgeRatio = 1.1;
var cameraZToEdgeRatio = 1.1;
var cameraXToEdgeRatio = -1.1;

// calls
init();
animate();

////////////////
// functions //
//////////////

function init() {

  // get canvas
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // create a new scene
  scene = new THREE.Scene();

  // add a camera
  var VIEW_ANGLE = 45;
  var ASPECT = window.innerWidth / window.innerHeight;
  var NEAR = 0.1;
  var FAR = edge * 20;
  camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
  scene.add(camera);

  // inital camera position is relativized to the overall scale
  camera.position.set(
      edge * cameraXToEdgeRatio,
      edge * cameraYToEdgeRatio,
      edge * cameraZToEdgeRatio);
  camera.lookAt(scene.position);

  // create the renderer
  renderer = new THREE.WebGLRenderer({antialias : true, alpha : true, canvas : canvas});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x1A1A1A, 1);

  effect = new THREE.StereoEffect(renderer);
  effect.eyeSeparation = 10;
  effect.setSize(window.innerWidth, window.innerHeight);

  // for the gyroscope positioning see:
  // https://virtualrealitypop.com/experimenting-with-threejs-for-virtual-reality-and-google-cardboard-86e67ba31b1c
  // https://github.com/jtq/cardboard-vr
  // https://www.sitepoint.com/bringing-vr-to-web-google-cardboard-three-js/

  // attach to container
  //document.getElementById('viz').appendChild(renderer.domElement);

  // controls
  controls = new THREE.OrbitControls(camera);
  controls.autoRotate = false;

  // add lights
  var light = new THREE.DirectionalLight(0xffffff, 1.5);
  light.position.set(100, 300, 100);
  scene.add(light);

  // add grid
  var gridxz = new THREE.GridHelper(edge,
                                    20,
                                    new THREE.Color(0x323232),
                                    new THREE.Color(0x323232)); //chill green
  gridxz.position.set(0, 0, 0);
  scene.add(gridxz);

  // add x axis line
  var lineGeometry = new THREE.Geometry();
  var vertArray = lineGeometry.vertices;
  vertArray.push(new THREE.Vector3(-edge, 0, 0), new THREE.Vector3(edge, 0, 0));
  lineGeometry.computeLineDistances();
  var lineMaterial = new THREE.LineDashedMaterial({color : 0xf68870, linewidth : edge * lineToEdgeRatio, gapSize : lineGapToEdgeRatio, dashSize : lineDashToEdgeRatio});
  var line = new THREE.Line(lineGeometry, lineMaterial);
  scene.add(line);

  // add y axis line
  var lineGeometry = new THREE.Geometry();
  var vertArray = lineGeometry.vertices;
  vertArray.push(new THREE.Vector3(0, -edge, 0), new THREE.Vector3(0, edge, 0));
  lineGeometry.computeLineDistances();
  var lineMaterial = new THREE.LineDashedMaterial({color : 0x325cb1, linewidth : edge * lineToEdgeRatio, gapSize : lineGapToEdgeRatio, dashSize : lineDashToEdgeRatio});
  var line = new THREE.Line(lineGeometry, lineMaterial);
  scene.add(line);

  // add z axis line
  var lineGeometry = new THREE.Geometry();
  var vertArray = lineGeometry.vertices;
  vertArray.push(new THREE.Vector3(0, 0, -edge), new THREE.Vector3(0, 0, edge));
  lineGeometry.computeLineDistances();
  var lineMaterial = new THREE.LineDashedMaterial({color : 0x3beca3, linewidth : edge * lineToEdgeRatio, gapSize : lineGapToEdgeRatio, dashSize : lineDashToEdgeRatio});
  var line = new THREE.Line(lineGeometry, lineMaterial);
  scene.add(line);
}

function animate() {
  requestAnimationFrame(animate);
  render();
  update();
}

function update() {
  controls.update();
  // stats.update();
}

function render() {
  effect.render(scene, camera);
  //renderer.render(scene, camera);
}

// resize - listener

window.addEventListener('resize', function() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  effect.setSize( window.innerWidth, window.innerHeight );
});

function resetCamera() {
  camera.position.set(
      edge * cameraXToEdgeRatio,
      edge * cameraYToEdgeRatio,
      edge * cameraZToEdgeRatio);
  camera.lookAt(scene.position);
}

window.addEventListener('mousemove', function() {
  mouseX = ( event.clientX - windowHalfX ) * 10;
  mouseY = ( event.clientY - windowHalfY ) * 10;
}, false);

////////
////////
// DATA PROCESSING
///////
///////

function fetchData(f) {
  // get the data
  // although async: false generates a deprecated warning,
  // we need the data to finish fetching file before loading
  //
  // TODO: Add .when / use deferred

  $.ajaxSetup({'async' : false})
  $.getJSON('./data/' + f + '.json', function(json) {
    data = json
  });
  console.log('Data Fetched');
}

function loadData() {

  // clear container
  organized = [];

  dataLength = _.size(_.values(data)[0]);

  for (var i = 0; i < dataLength; i++) {
    point = {};
    for (p in data) {
      if (data.hasOwnProperty(p)) {
        point[p] = data[p][i]
      }
    }
    organized.push(point);
  }
}

function plotData() {

  // get those points
  loadData();

  // resize edge based on max min & reinitialize planes
  edge = getLimits() * edgePaddingMultiplier
  init();

  var sprite = new THREE.TextureLoader().load("./data/disc.png");
  console.log("Initalized");

  // zip and group
  var keys = Object.keys(data)
  grouped = _.groupBy(organized, keys[3]) // group by color
  groupedSize = _.size(grouped);
  groupedKeys = Object.keys(grouped);

  // color options
  colors = palette('rainbow', groupedSize);
  for(var i=0;i<colors.length;i++){
      colors[i]="#"+colors[i];
  }

  for (var i = 0; i < groupedSize; i++) {

    // create new point cloud material
    var pointGeometry = new THREE.Geometry();
    pointColors = [];

    // loop through points
    for (var j = 0; j < grouped[groupedKeys[i]].length; j++) {

      var vertex = new THREE.Vector3();
      vertex.x = grouped[groupedKeys[i]][j][keys[0]];
      vertex.y = grouped[groupedKeys[i]][j][keys[1]];
      vertex.z = grouped[groupedKeys[i]][j][keys[2]];
      pointGeometry.vertices.push(vertex);

      // assign colors
      pointColors[j] = new THREE.Color(colors[i]);
    }

    console.log(grouped[groupedKeys[i]].length + " points in cluster " + groupedKeys[i])
    pointGeometry.colors = pointColors

    // create new point cloud
    var pointCloudMaterial = new THREE.PointsMaterial({
      size : edge * pointToEdgeRatio,
      color : colors[i],
      vertexColors : THREE.VertexColors,
      alphaTest : 0.5,
      transparent : true,
      opacity : 0.8,
      map : sprite
    });

    // Use this to change the entire material
    //pointCloudMaterial.color.setHSL( 3.0, 0.8, 0.8 );

    var pointCloud = new THREE.Points(pointGeometry, pointCloudMaterial)
    scene.add(pointCloud)
  }
  return true
}

function getLimits() {
  // container for potential x-z grid size
  potentialEdges = [];
  for (col in data) {
    // http://stackoverflow.com/questions/11142884
    var min = _.min(data[col]);
    var max = _.max(data[col]);
    if (isFinite(min) && isFinite(max)) {
      potentialEdges.push(Math.abs(min), max);
    }
  }
  return _.max(potentialEdges);
}
