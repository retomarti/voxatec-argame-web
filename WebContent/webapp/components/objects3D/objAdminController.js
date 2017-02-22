var ARGameApp=angular.module("ARGameApp", ['ngSanitize','rmForms','bsLoadingOverlay']);


<!-- Browser Controller --------------------------------------------------------------------------------->
ARGameApp.controller('BrowserCtrl', ['$scope', '$sce', '$http', 'bsLoadingOverlayService',
	function($scope, $sce, $http, bsLoadingOverlayService) {
	
		<!-- Adventure Browser Model -->
		$scope.proxy = null;
		$scope.prototypes = new Object();
		
		$scope.object3DList = new Array();	  // object3D list used for object3D selection in scenes
		$scope.object3DSelIdx = null;
		
		$scope.activeTabName = "attr";		  // 'attr', '3Dview' 'objfile', 'mtlfile', 'texfile'

		$scope.formModel = null;

		$scope.objFile = null;
		$scope.mtlFile = null;
		$scope.texFile = null;
		$scope.texFileList = Array();
		$scope.visibleFile = null;
		$scope.visibleFileType = null;
		$scope.selectedFile = null;
		
		$scope.texImageURL = "";
		$scope.selectedTex = null;
		
		<!-- Methods ----------------------------------------------------------------------->
		
		// Overlay & spinner
		$scope.showOverlay = 
			function(referenceId) {
				bsLoadingOverlayService.start({
					referenceId: referenceId
				});
			};

		$scope.hideOverlay = 
			function(referenceId) {
				bsLoadingOverlayService.stop({
					referenceId: referenceId
				});
			}
			
		$scope.doInitRequest = 
			function($http) {
				// Show overlay & spinner
				$scope.showOverlay("pageBody");
			
				// Get proxy definition
				var url = "./webapp/shared/config/proxy.json";
				$http.get(url).success(function(jsonResponse) {
					$scope.proxy = $scope.deepDecodeJSON(jsonResponse);

					// Get the object layout rules
					var url = "./webapp/shared/layouts/layout-rules.json";
					$http.get(url).success(function(jsonResponse) {
						$scope.formLayoutRules = jsonResponse;
					});
			
					// Get all object3D entities
					url = "http://"  + $scope.proxy.restServer + "/objects3D";
					$http.get(url).success(function(jsonResponse) {
						$scope.object3DList = $scope.deepDecodeJSON(jsonResponse);
						$scope.setSelectedObject3D($scope.object3DList[0]);
						$scope.setActiveTab("attr");
						
						// Hide overlay & spinner
						$scope.hideOverlay("pageBody");
					});
				
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


		$scope.load_modal = 
			// refer to: http://stackoverflow.com/questions/35527788/dynamically-load-bootstrap-modal-content-and-open-it-using-angular-js
			function (templateURL) {
		        var modal = ModalService.showModal({
		          templateUrl: templateURL, // eg. /template/upload_file_modal.html
		          controller: function () { /* controller code */ }
		        }).then(function (modal) {
		            // Modal has been loaded...
		            modal.element.modal();
		        });
		    };
						
		$scope.selectedObject3D =
			function() {
				var selIdx = $scope.object3DSelIdx;
				if (selIdx >= 0)
					return $scope.object3DList[selIdx];
				else
					return null;
			};
			
		$scope.setSelObject3DDirty =
			function() {
				var obj3D = $scope.selectedObject3D();
				if (obj3D != null) {
					obj3D.isDirty = true;
				}
			};
			
		$scope.isSelObject3DDirty =
			function() {
				if (angular.isDefined($scope.formModel) && $scope.formModel != null)
					return $scope.formModel.isFormDirty();
				else
					return false;
			};
			
		$scope.setSelObject3DClean =
			function() {
				if (angular.isDefined($scope.formModel) && $scope.formModel != null)
					$scope.formModel.setFormClean();
			};
				
		$scope.getObject3DFiles = 
			function(object) {
			
				if (angular.isDefined(object) && object != null && object.id != -1) {
					// Show overlay & spinner
					$scope.showOverlay("formBody");
					
					// request obj file from service
					var url = "http://" + $scope.proxy.restServer + "/files/obj/" + object.id;
					$http.get(url).success(function(response) {
						$scope.objFile = $scope.decodeHtml(response);
						
						// Hide overlay & spinner
						$scope.hideOverlay("formBody");
					});

					// request mtl file from service
					var url = "http://" + $scope.proxy.restServer + "/files/mtl/" + object.id;
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
						$scope.resetSelection();
						$scope.object3DSelIdx = idx;
						$scope.texFileList = object.textureList;
						if ($scope.texFileList != null && $scope.texFileList.length > 0) {
							$scope.selectTexture($scope.texFileList[0]);
						}
						else {
							$scope.selectTexture(null);
						}
						$scope.getObject3DFiles(object);
						$scope.setupFormModelForObject(object);
						$scope.setActiveTab('attr');
						return;
					}
				}
			};
			
		$scope.resetSelection =
			function() {
				$scope.object3DSelIdx = -1;
				$scope.object3DImageURL = "";
				$scope.objFile = null;
				$scope.mtlFile = null;
				$scope.texFile = null;
				$scope.selectedTex = null;
				$scope.texImageURL = "";
				$scope.visibleFile = null;
				$scope.visibleFileType = null;
				$scope.selectedFile = null;
			};
			
		$scope.saveSelectedObject3D = 
			function() {
				if ($scope.isSelObject3DDirty()) {
					console.log("saving selected object");
					var obj3D = $scope.selectedObject3D();
					
					if (angular.isDefined(obj3D) && obj3D != null) {
						
						$scope.updateObjectFromFormModel(obj3D, $scope.formModel);
						
						var json = angular.toJson(obj3D, false);
						json = $scope.deepEncodeJSON(json);
						
						// Show overlay & spinner
						$scope.showOverlay("formBody");
						
						if (obj3D.id == null || obj3D.id == -1) {
							var url = "http://" + $scope.proxy.restServer + "/objects3D";

							var res = $http.post(url, json)
											.then(function(jsonResponse) {
												// Hide overlay & spinner
												$scope.hideOverlay("formBody");
												
											}, function errorCallback(response) {
											    // called asynchronously if an error occurs
											    // or server returns response with an error status.
												console.log("error saving object3D: " + response);
												// Hide overlay & spinner
												$scope.hideOverlay("formBody");
											}
							);		
						}
						else {
							var url = "http://" + $scope.proxy.restServer + "/objects3D/" + obj3D.id;
							var res = $http.put(url, json)
											.then(function(jsonReponse) {
												// Hide overlay & spinner
												$scope.hideOverlay("formBody");
											})
						}
	
						$scope.setSelObject3DClean();
					}
				}
				else {
					console.log("nothing to save");
				}
			};
			
		$scope.setupFormModelForObject =
			function(object) {
				if (object.className == 'Object3D') {
					$scope.formModel = 
						rmForms.FormModelBuilder()
						.addTab('Attributes')
						.addNumberField('id', 'Id', object.id, true)
						.addStringField('name', 'Name', object.name, false)
						.addStringField('objFileName', 'Obj File Name', object.objFileName, true)
						.addStringField('mtlFileName', 'Mtl File Name', object.mtlFileName, true)
						.addNumberField('objScaleFactor', 'Scale Factor', object.objScaleFactor, false)
						.setActiveTab(0);
				}
			};
				
		$scope.updateObjectFromFormModel = 
			function(object, formModel) {
				// Update object with form field values
				for (tabIdx in formModel.tabs) {
					var tab = formModel.tabs[tabIdx];
					for (fieldIdx in tab.fields) {
						var field = tab.fields[fieldIdx];
						if (field.dirty && angular.isDefined(object[field.key])) {
							object[field.key] = field.value;
						}
					}
				}
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
				    var intensity = 0.3;
				    keyLight = new THREE.DirectionalLight(new THREE.Color('hsl(30, 100%, 75%)'), 1.0 * intensity);
				    keyLight.position.set(-100, 0, 100);

				    fillLight = new THREE.DirectionalLight(new THREE.Color('hsl(240, 100%, 75%)'), 0.75 * intensity);
				    fillLight.position.set(100, 0, 100);

				    backLight = new THREE.DirectionalLight(0xffffff, 0.6);
				    backLight.position.set(100, 0, -100).normalize();

				    scene.add(keyLight);
				    scene.add(fillLight);
				    scene.add(backLight);
				    
				    // model setup
				    var mtlLoader = new THREE.MTLLoader();
				    var baseUrl = "http://" + $scope.proxy.restServer + "/files/";
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
						
		$scope.setActiveTab =
			function(tabName) {
				if (tabName === $scope.activeTabName)
					return; // nothing to do
				
				$scope.activeTabName = tabName;
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
			
		$scope.selectTexture = 
			function(texture) {
				if (texture != null) {
					var object = $scope.selectedObject3D();
					$scope.selectedTex = texture;
					$scope.texImageURL = "http://" + $scope.proxy.restServer + "/files/mtl/" + object.id + "/" + texture.name;
				}
				else {
					$scope.selectedTex = null;
					$scope.texImageURL = "";
				}
			};
			
		$scope.uploadTexImgFile =
			function(fileName, imageData, fileType, object) {
			
				// Show overlay & spinner
				$scope.showOverlay("formBody");

				//send file to REST service
				var imgFile = {"className": "File", "name": null, "mimeType": "image/*", "content": null};
				imgFile.name = fileName;
				imgFile.content = $scope.encodeBase64(imageData);
				var url = "http://" + $scope.proxy.restServer + "/files/mtl/" + object.id + "/" + fileName;

				var res = $http.post(url, imgFile)
					.then(function(jsonResponse) {
						// update imgFile object
						imgFile = $scope.deepDecodeJSON(jsonResponse);
						
						// let image viewer show uploaded image
						$scope.texImageURL = url;
						$scope.texFile = imgFile;
						$scope.texFileList.push(imgFile);
						$scope.selectedTex = imgFile;
						
						// Hide overlay & spinner
						$scope.hideOverlay("formBody");
						
					}, function errorCallback(response) {
					    // called asynchronously if an error occurs
					    // or server returns response with an error status.
						console.log("error uploading texture: " + response);
						
						// Hide overlay & spinner
						$scope.hideOverlay("formBody");
					}
				);
			};
				
		$scope.uploadTextFile =
			function(fileName, fileData, fileType, object) {
			
				// Show overlay & spinner
				$scope.showOverlay("formBody");
				
				//send file to REST service
				var file = {"className": "File", "name": null, "mimeType": "application/json", "content": null};
				file.name = fileName;
				file.content = fileData;
				file = $scope.deepEncodeJSON(file);
						
				var url = "http://" + $scope.proxy.restServer + "/files/";
						
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

				var res = $http.put(url, file)
								.then(function(jsonResponse) {
									// Hide overlay & spinner
									$scope.hideOverlay("formBody");
								});
			};
			
		$scope.uploadVisibleFile =
			function() {
				var object = $scope.selectedObject3D();

				if (angular.isObject(object)) {
					var fileElem = document.getElementById('uploadFile');
					var file = fileElem.files[0];
					var fileReader = new FileReader();
					
					if ($scope.activeTabName == 'objfile' || $scope.activeTabName == 'mtlfile') {
				
						// Its an .obj or .mtl file
						fileReader.onloadend = function() {
							// Validate file
							
							// Upload text file
							var fileName = file.name;
							var textData = fileReader.result;
							var fileType = $scope.visibleFileType;
							$scope.uploadTextFile(fileName, textData, fileType, object);
						}
						
						fileReader.readAsText(file);
						
					} else if ($scope.activeTabName == 'texfile') {
						
						// It's an image file (.jpg, .png)
						fileReader.onloadend = function() {

							// Upload image file
							var fileName = file.name;
							var imageData = fileReader.result;
							var fileType = $scope.visibleFileType;
							$scope.uploadTexImgFile(fileName, imageData, fileType, object);
						}
						
						fileReader.readAsArrayBuffer(file);	
					}
					
					$scope.selectedFile = null;
				};
			};
			
		$scope.createNewObject3D = 
			function(object3DName) {
				console.log("New object3D: " + object3DName);
				$scope.resetSelection();
				
				// Show overlay & spinner
				$scope.showOverlay("objectPanel");
				
				// create new object3D & insert it into objectList
				object3D = new Object();
				object3D.name = object3DName;
				object3D.text = "";
				
				// Post it to service
				var url = "http://" + $scope.proxy.restServer + "/objects3D";
				var json = $scope.deepEncodeJSON(object3D);

				$http.post(url,json)
					.then(function(jsonResponse) {
						// extract new created object3D
						var newObject3D = $scope.deepDecodeJSON(jsonResponse).data;
						object3D.id = newObject3D.id;
						$scope.object3DList.push(object3D);
						$scope.setSelectedObject3D(object3D);
						$scope.objFile = null;
						$scope.mtlFile = null;
						$scope.texFile = null;
						
						// Hide overlay & spinner
						$scope.hideOverlay("objectPanel");
						
					}, function errorCallback(response) {
					    // called asynchronously if an error occurs
					    // or server returns response with an error status.
						console.log("error creating new object3D: " + response);
						
						// Hide overlay & spinner
						$scope.hideOverlay("objectPanel");
					}
				);
	
				// Clear dialog input
				$scope.dialogInput = null;
			};
			
		$scope.deleteObject3D =
			function(object3D) {
				console.log("Delete object3D: " + object3D.name);
			
				if (object3D == null || object3D.id == -1)
					return;   // nothing to do
				
				// Show overlay & spinner
				$scope.showOverlay("objectPanel");
			
				// Delete via service
				var url = "http://" + $scope.proxy.restServer + "/objects3D/" + object3D.id;
				$http.delete(url).then(function(jsonResponse) {
					// remove object3D in browser list
					var idx = $scope.object3DList.indexOf(object3D);
					$scope.object3DList.splice(idx,1);
					$scope.resetSelection();
					
					// Hide overlay & spinner
					$scope.hideOverlay("objectPanel");
				});

			};
			
		$scope.deleteTexFile = 
			function(texFile, object3D) {
				console.log("Delete tex file: " + texFileName);
				
				if (object3D == null || object3D.id == -1 || texFile == null)
					return;   // nothing to do
				
				// Show overlay & spinner
				$scope.showOverlay("formBody");
				
				// Delete via service
				var url = "http://" + $scope.proxy.restServer + "/mtl/" + object3D.id + "/" + texFile.name;
				$http.delete(url)
					.then(function(jsonResponse) {
						// remove texFile in texture list
						var idx = $scope.texFileList.indexOf(texFile);
						$scope.texFileList.splice(idx,1);
						
						// Hide overlay & spinner
						$scope.hideOverlay("formBody");
						
					}, function errorCallback(response) {
					    // called asynchronously if an error occurs
					    // or server returns response with an error status.
						console.log("error deleting tex file: " + response);
						
						// Hide overlay & spinner
						$scope.hideOverlay("formBody");
					} 
				);
			
			};	

}])

<!-- Directives ----------------------------------------------------------------------------------------->

<!-- Directive to show spinner & overlay -->
.run(function(bsLoadingOverlayService) {
	bsLoadingOverlayService.setGlobalConfig({
		templateUrl: './webapp/shared/directives/loading-overlay-template.html'
})})
