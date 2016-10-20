var ARGameApp=angular.module("ARGameApp", ['ngSanitize']);


<!-- Browser Controller --------------------------------------------------------------------------------->
ARGameApp.controller('BrowserCtrl', ['$scope', '$sce', '$http',
	function($scope, $sce, $http) {
	
		<!-- Adventure Browser Model -->
		$scope.prototypes = new Object();
		$scope.object3DList = new Array();	  // object3D list used for object3D selection in scenes
		$scope.object3DSelIdx = null;
		$scope.object3DImageURL = null;
		$scope.activeTabName = "attr";		  // 'attr', '3Dview' 'objfile', 'mtlfile', 'texfile'
		$scope.objFile = null;
		$scope.mtlFile = null;
		$scope.texFile = null;
		$scope.visibleFile = null;
		$scope.visibleFileType = null;
		$scope.selectedFile = null;
		
		<!-- Methods ----------------------------------------------------------------------->
		
		$scope.doInitRequest = 
			function($http) {
				// Get all object3D entities
				url = "http://" + window.location.hostname + ":9090/argame/objects3D";
				$http.get(url).success(function(jsonResponse) {
					$scope.object3DList = $scope.deepDecodeJSON(jsonResponse);
					$scope.setSelectedObject3D($scope.object3DList[0]);
					$scope.setActiveTab("attr");
				});
				
			};
			
		// Do initial request for model
		$scope.doInitRequest($http);
		
		$scope.decodeHtml =
			function(html) {
			    var txt = document.createElement("textarea");
			    txt.innerHTML = html;
			    return txt.value;
			};
			
		$scope.encodeHtml = 
			function(string) {
				return $('<div/>').text(string).html();
			};
			
		$scope.encodeBase64 =
			function(byteArray) {
				// Base64 encoding
				var binary = '';
				var bytes = new Uint8Array(byteArray);
				var len = bytes.byteLength;
				for (var i=0; i<len; i++) {
					binary += String.fromCharCode(bytes[i]);
				}
				return window.btoa(binary);
			};
			
		$scope.deepDecodeJSON = 
			function (object) {	 
				var val;
			  
				for (var propName in object) {
					val = object[propName]; // just in case there's some other type of property
					if(angular.isString(object[propName])) {
						val = $scope.decodeHtml(object[propName]);	
						object[propName] = val;
					}
					else if(angular.isObject(object[propName])) {
						val = $scope.deepDecodeJSON(object[propName]);
						object[propName] = val;
					}
			    }	

				return object;
			};
			
		$scope.deepEncodeJSON = 
			function (object) {
				var val;
				  
				for (var propName in object) {
					val = object[propName]; // just in case there's some other type of property
					if(angular.isString(object[propName])) {
						val = $scope.encodeHtml(object[propName]);	
						object[propName] = val;
					}
					else if(angular.isObject(object[propName])) {
						val = $scope.deepEncodeJSON(object[propName]);
						object[propName] = val;
					}
			    }	
	
				return object;
			};
						
		$scope.selectedObject3D =
			function() {
				var selIdx = $scope.object3DSelIdx;
				if (selIdx >= 0)
					return $scope.object3DList[selIdx];
				else
					return null;
			};
			
			
		$scope.getObject3DFiles = 
			function(object) {
			
				if (angular.isDefined(object) && object != null && object.id != -1) {
					// request obj file from service
					var url = "http://" + window.location.hostname + ":9090/argame/files/obj/" + object.id;
					$http.get(url).success(function(response) {
						$scope.objFile = $scope.decodeHtml(response);
					});

					// request mtl file from service
					var url = "http://" + window.location.hostname + ":9090/argame/files/mtl/" + object.id;
					$http.get(url).success(function(response) {
						$scope.mtlFile = $scope.decodeHtml(response);
					});
				}
			};
			
		$scope.setSelectedObject3D =
			function(object) {
				for (idx in $scope.object3DList) {
					var obj = $scope.object3DList[idx];
					if (obj == object) {
						$scope.object3DSelIdx = idx;
						$scope.object3DImageURL = "http://" + window.location.hostname + ":9090/argame/images/object3D/" + object.id;
						$scope.getObject3DFiles(object);
						$scope.setActiveTab('attr');
						return;
					}
				}
			};
			
		$scope.resetSelection =
			function() {
				$scope.object3DSelIdx = -1;
				$scope.object3DImageURL = "";
			};
			
		$scope.remove3DView = 
			function() {
				var container = document.getElementById("content-container");
				var elem = container.firstChild;
				while (angular.isDefined(elem) && elem!=null) {
					var nextElem = elem.nextSibling;
					if (elem.nodeName.toLowerCase() === 'canvas') {
						container.removeChild(elem);
					}
					elem = nextElem;
				}
			};
			
		$scope.start3DViewer =
			function(object3D) {
				// 3D viewer: https://manu.ninja/webgl-3d-model-viewer-using-three-js
				// The detector will show a warning if the current browser does not support WebGL.
				if (!Detector.webgl) {
				    Detector.addGetWebGLMessage();
				}
				
				// All of these variables will be needed later, just ignore them for now.
				var container;
				var camera, controls, scene, renderer;
				var lighting, ambient, keyLight, fillLight, backLight;
				var windowHalfX = window.innerWidth / 2;
				var windowHalfY = window.innerHeight / 2;
				var width, height;
				
				init();
				render();

				function init() {				    
				    container = document.getElementById("content-container");
				    width = container.clientWidth;
				    height = container.clientWidth;
				    
				    // camera setup
				    camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
				    camera.position.z = 50;
				    
				    // scene setup
				    scene = new THREE.Scene();
				    ambient = new THREE.AmbientLight(0xffffff, 1.0);
				    scene.add(ambient);
				    
				    // light setup
				    keyLight = new THREE.DirectionalLight(new THREE.Color('hsl(30, 100%, 75%)'), 1.0);
				    keyLight.position.set(-100, 0, 100);

				    fillLight = new THREE.DirectionalLight(new THREE.Color('hsl(240, 100%, 75%)'), 0.75);
				    fillLight.position.set(100, 0, 100);

				    backLight = new THREE.DirectionalLight(0xffffff, 1.0);
				    backLight.position.set(100, 0, -100).normalize();

				    // scene.add(keyLight);
				    // scene.add(fillLight);
				    scene.add(backLight);
				    
				    // model setup
				    var mtlLoader = new THREE.MTLLoader();
				    var baseUrl = "http://" + window.location.hostname + ":9090/argame/files/";
				    mtlLoader.setPath(baseUrl + 'mtl/' + object3D.id + '/');
				    mtlLoader.load("", function (materials) {

				        materials.preload();

				        // materials.materials.default.map.magFilter = THREE.NearestFilter;
				        // materials.materials.default.map.minFilter = THREE.LinearFilter;

				        var objLoader = new THREE.OBJLoader();
				        objLoader.setMaterials(materials);
				        objLoader.setPath(baseUrl + 'obj/');
				        objLoader.load(object3D.id, function (object) {

				            scene.add(object);

				        });

				    });
				    
				    // setup renderer
				    renderer = new THREE.WebGLRenderer();
				    renderer.setPixelRatio(window.devicePixelRatio);
				    renderer.setSize(width, height);   // window.innerWidth, window.innerHeight
				    renderer.setClearColor(new THREE.Color("hsl(0, 0%, 10%)"));

				    container.appendChild(renderer.domElement);
				    
				    // setup orbit controls
				    controls = new THREE.OrbitControls(camera, renderer.domElement);
				    controls.enableDamping = true;
				    controls.dampingFactor = 0.25;
				    controls.enableZoom = true;
				}

				function render() {
				    requestAnimationFrame(render);
				    controls.update();
				    renderer.render(scene, camera);
				}
			};
			
		$scope.stop3DViewer = 
			function() {
			
			};
			
		$scope.setActiveTab =
			function(tabName) {
				$scope.activeTab = tabName;
			    $scope.remove3DView();  // First, lets remove a previous 3D view

				if (tabName == 'attr') {
					
				} else if (tabName == '3Dview') {
					var selObject3D = $scope.object3DList[$scope.object3DSelIdx];
					if (angular.isObject(selObject3D)) {
						$scope.start3DViewer(selObject3D);
					}
				} else if (tabName == 'objfile') {
					$scope.visibleFile = $scope.objFile;
					$scope.visibleFileType = "obj";
				}
				else if (tabName == 'mtlfile') {
					$scope.visibleFile = $scope.mtlFile;
					$scope.visibleFileType = "mtl";
				}
				else if (tabName == 'texfile') {
					$scope.visibleFile = $scope.texFile;
					$scope.visibleFileType = "tex";
				}
			};
			
		$scope.uploadImage =
			function() {
				var fileElem = document.getElementById('imgFile');
				var file = fileElem.files[0];
				var fileReader = new FileReader();
				
				fileReader.onloadend = function() {
					var object = $scope.selectedObject3D();

					if (angular.isObject(object)) {
						//send file to REST service
						var imageData = fileReader.result;
						var imgFile = {"className": "File", "mimeType": "image/png", "content": null};
						imgFile.content = $scope.encodeBase64(imageData);
						var url = "http://" + window.location.hostname + ":9090/argame/images/object3D/" + object.id;
						var res = $http.put(url, imgFile);
						
						// set new image in UI
						$scope.object3DImageURL = url;
					}
				}
				fileReader.readAsArrayBuffer(file);	
			};
				
		$scope.uploadTextFile =
			function(fileName, fileData, fileType, object) {
				
				//send file to REST service
				var file = {"className": "File", "name": null, "mimeType": "application/json", "content": null};
				file.name = fileName;
				file.content = fileData;
				file = $scope.deepEncodeJSON(file);
						
				var url = "http://" + window.location.hostname + ":9090/argame/files/";
						
				if (fileType == "obj") {
					url = url + "obj/" + object.id;
					$scope.objFile = fileData;
				}
				else if (fileType == "mtl") {
					url = url + "mtl/" + object.id;
					$scope.mtlFile = fileData;
				}
				else if (fileType == "mtl") {
					url = url + "tex/" + object.id;
					$scope.texFile = fileData;
				}
				$scope.visibleFile = fileData;

				var res = $http.put(url, file);
			};
			
		$scope.uploadVisibleFile =
			function() {
				var object = $scope.selectedObject3D();

				if (angular.isObject(object)) {
					var fileElem = document.getElementById('uploadFile');
					var file = fileElem.files[0];
					var fileReader = new FileReader();
				
					fileReader.onloadend = function() {
						// Validate file
						
						// Upload file
						var fileName = file.name;
						var fileType = $scope.visibleFileType;
						var fileData = fileReader.result;
						
						$scope.uploadTextFile(fileName, fileData, fileType, object)
					}
					
					fileReader.readAsText(file);
				};
			};
			
		$scope.createNewObject3D = 
			function(object3DName) {
				console.log("New object3D: " + object3DName);
				
				// create new object3D & insert it into objectList
				object3D = new Object();
				object3D.name = object3DName;
				
				// Post it to service
				var url = "http://" + window.location.hostname + ":9090/argame/objects3D";
				var json = $scope.deepEncodeJSON(object3D);
				$http.post(url,json).then(function(jsonResponse) {
					// extract new created object3D
					var newObject3D = $scope.deepDecodeJSON(jsonResponse).data;
					object3D.id = newObject3D.id;
					$scope.object3DList.push(object3D);
					$scope.setSelectedObject3D(object3D);
				});
	
				// Clear dialog input
				$scope.dialogInput = null;
			};
			
		$scope.deleteObject3D =
			function(object3D) {
				console.log("Delete object3D: " + object3D.name);
			
				if (object3D == null || object3D.id == -1)
					return;   // nothing to do
			
				// Delete via service
				var url = "http://" + window.location.hostname + ":9090/argame/objects3D/" + object3D.id;
				$http.delete(url).then(function(jsonResponse) {
					// remove object3D in browser list
					var idx = $scope.object3DList.indexOf(object3D);
					$scope.object3DList.splice(idx,1);
					$scope.resetSelection();
				});

			};

}])