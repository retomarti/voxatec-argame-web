var ARGameApp=angular.module("ARGameApp", ['ngSanitize','rmForms','rmFileUploadDialogs']);


<!-- Browser Controller --------------------------------------------------------------------------------->
ARGameApp.controller('CacheCtrl', ['$scope', '$sce', '$http',
	function($scope, $sce, $http) {
	
		<!-- Cache Browser Model -->		
		$scope.proxy = null;

		$scope.browserList = new Array();
		$scope.browserSelection = new Array();
		
		$scope.formModel = null;
		$scope.uploadDialogModel = null;
		
		$scope.activeTabName = "attr";		  // 'attr', 'xmlfile', 'datfile', 'targetImgfile'

		$scope.xmlFile = null;
		$scope.datFile = null;
		$scope.targetImageURL = "";
		$scope.targetImageFile = null;
		$scope.visibleFile = null;
		$scope.visibleFileType = null;
		$scope.selectedFile = null;

		
		<!-- Methods ----------------------------------------------------------------------->
		
		$scope.encodeHtml = 
			function(string) {
				return $('<div/>').text(string).html();
			}
			
		$scope.decodeHtml =
			function(html) {
			    var txt = document.createElement("textarea");
			    txt.innerHTML = html;
			    return txt.value;
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
						
		$scope.doInitRequest = 
			function($http) {
				// Get proxy definition
				var url = "./webapp/shared/config/proxy.json";
				$http.get(url).success(function(jsonResponse) {
					$scope.proxy = $scope.deepDecodeJSON(jsonResponse);
			
					// Get all city, cache-group & cache entities
					url = "http://" + $scope.proxy.restServer + "/city-caches";
					$http.get(url).success(function(jsonResponse) {
						// Extract city list
						var cities = $scope.deepDecodeJSON(jsonResponse);
						$scope.browserList[0] = cities;
						
						// Set browser selection
						var sel = $scope.browserList[0][0];
						$scope.setBrowserSelection(0, sel);
					});
				});
			};
			
		// Do initial request for model
		$scope.doInitRequest($http);
		
		$scope.selectedObject =
			function() {
				i = 0;
				selection = null;
				do {
					selection = $scope.browserSelection[i];
					i++; 
				} while (i <= 2 && $scope.browserSelection[i] != null);
				return selection;
			};
				
		$scope.selectedObjectType =
			function() {
				objectTypes = ['City','CacheGroup','Cache'];
				sel = -1;
				while (sel < 2 && $scope.browserSelection[sel+1] != null) {
					sel++; 
				};
				
				if (sel >= 0 && sel <= 2 ) {
					return objectTypes[sel];
				}
				else
					return null;
			};
			
		$scope.setupFormModelForObject =
			function(object) {
				if (object.className == 'City') {
					$scope.formModel = 
						rmForms.FormModelBuilder()
						.addTab('Attributes')
						.addNumberField('id', 'Id', object.id, true)
						.addStringField('name', 'Name', object.name, false)
						.addStringField('zip', 'Zip', object.zip, false)
						.addStringField('country', 'Country', object.country, false)
						.setActiveTab(0);
				}
				else if (object.className == 'CacheGroup'){
					$scope.formModel = 
						rmForms.FormModelBuilder()
						.addTab('Attributes')
						.addNumberField('id', 'Id', object.id, true)
						.addStringField('name', 'Name', object.name, false)
						.addTextField('text', 'Text', object.text, false)
						.setActiveTab(0);
				}
				else if (object.className == 'Cache') {
					$scope.formModel = 
						rmForms.FormModelBuilder()
						.addTab('Attributes')
						.addNumberField('id', 'Id', object.id, true)
						.addStringField('name', 'Name', object.name, false)
						.addTextField('text', 'Text', object.text, false)
						.addStringField('street', 'Street', object.street, false)
						.addNumberField('gpsLatitude', 'GPS lat.', object.gpsLatitude, false)
						.addNumberField('gpsLongitude', 'GPS long.', object.gpsLongitude, false)
						.setActiveTab(0);
				}
			};
			
		$scope.setupTargetImageForObject =
			function(object) {
				if (object != null && object.id != -1) {
					$scope.targetImageURL = "http://" + $scope.proxy.restServer + "/files/target-img/" + object.id;
				}
				else {
					$scope.targetImageURL = "";
				}
			};
			
		$scope.setupXmlFileForObject =
			function(object) {
				if (object != null && object.id != -1) {
				}
				else {
					$scope.targetImageURL = "";
				}
			};
			
		$scope.setupContentTabsForObject = 
			function(object) {
				// attr tab
				$scope.setupFormModelForObject(object);
				
				// target image tab
				if (object.className == 'CacheGroup') {
					$scope.setupXmlFileForObject(object);
				}
				else if (object.className == 'Cache') {
					$scope.setupTargetImageForObject(object);
				}
			};
			
		$scope.resetBrowserSelection =
			function () {
				$scope.browserSelection = new Array();
				$scope.setActiveTab('attr');
				$scope.targetImageURL = "";
			};
		
		$scope.setBrowserSelection =
			function(inListNr, selectedObject) {
			
				if (inListNr >=0 && inListNr <=2) {
					if (selectedObject == null) {
						// Reset selection
						if (inListNr >= 1) {
							var newSelection = $scope.browserSelection[inListNr-1];
							$scope.setBrowserSelection(inListNr-1, newSelection);
						}
						else {
							$scope.resetBrowserSelection();
							$scope.resetFormList();
						}
					}
					else {
						// Set new selection
						if (selectedObject != $scope.browserSelection[inListNr]) {
							$scope.browserSelection[inListNr] = selectedObject;
						}
						// Set browser list contents
						if (inListNr==0) {
							$scope.browserList[1] = selectedObject.cacheGroupList;
							$scope.browserList[2] = null;
							$scope.browserSelection[1] = null;
							$scope.browserSelection[2] = null;
						}
						else if (inListNr==1) {
							$scope.browserList[2] = selectedObject.cacheList;
							$scope.browserSelection[2] = null;
						}
						
						// Setup content view
						$scope.setupContentTabsForObject(selectedObject);
					}
 				}
			};
			
		$scope.setActiveTab =
			function(tabName) {
				if (tabName === $scope.activeTabName)
					return; // nothing to do
				
				$scope.activeTabName = tabName;

				if (tabName == 'attr') {
					
				} else if (tabName == 'xmlfile') {
					$scope.visibleFile = $scope.xmlFile;
					$scope.visibleFileType = "xml";
				}
				else if (tabName == 'datfile') {
					$scope.visibleFile = $scope.datFile;
					$scope.visibleFileType = "dat";
				}
				else if (tabName == 'targetImgfile') {
					$scope.visibleFile = $scope.targetImgFile;
					$scope.visibleFileType = "img";
				}
			};
				
		$scope.saveCity =
			function($http, city) {
				var json = angular.toJson(city, false);
				json = $scope.deepEncodeJSON(json);
				
				if (city.id == null || city.id == -1) {
					// New city -> POST
					var url = "http://" + $scope.proxy.restServer + "/cities";
					var res = $http.post(url, json);		
				}
				else {
					// Existing city -> PUT
					var url = "http://" + $scope.proxy.restServer + "/cities/" + city.id;
					var res = $http.put(url, json);
				}
				console.log(res);
			};
			
		$scope.saveCacheGroup = 
			function($http, cacheGroup) {
				var json = angular.toJson(cacheGroup, false);
				json = $scope.deepEncodeJSON(json);
				
				if (cacheGroup.id == null || cacheGroup.id == -1) {
					// New cacheGroup -> POST
					var url = "http://" + $scope.proxy.restServer + "/cache-groups";
					var res = $http.post(url, json);					
				}
				else {
					// Existing cacheGroup -> PUT
					var url = "http://" + $scope.proxy.restServer + "/cache-groups/" + cacheGroup.id;
					var res = $http.put(url, json);
				}
				console.log(res);
			};
			
		$scope.saveCache = 
			function($http, cache) {
				var json = angular.toJson(cache, false);
				json = $scope.deepEncodeJSON(json);
				
				if (cache.id == null || cache.id == -1) {
					// New cache -> POST
					var url = "http://" + $scope.proxy.restServer + "/caches";
					var res = $http.post(url, json);					
				}
				else {
					// Existing cache -> PUT
					var url = "http://" + $scope.proxy.restServer + "/caches/" + cache.id;
					var res = $http.put(url, json);
				}
				console.log(res);
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
			
		$scope.setFieldDirty = 
			function(field) {
				$scope.formModel.setFieldDirty(field);
			};
			
		$scope.isFormDirty =
			function() {
				if (angular.isDefined($scope.formModel) && $scope.formModel != null)
					return $scope.formModel.isFormDirty();
				else
					return false;
			};
			
		$scope.setFormListClean =
			function() {
				$scope.formModel.setFormClean();
			};
			
		$scope.saveSelectedObject = 
			function() {
				if ($scope.isFormDirty()) {
					console.log("saving selected object");
					
					var obj = $scope.selectedObject();
					
					switch ($scope.selectedObjectType()) {
						case "City":
							$scope.updateObjectFromFormModel(obj, $scope.formModel);
							$scope.saveCity($http, obj);
							break;
						case "CacheGroup":
							if ($scope.activeTabName == 'attr') {
								$scope.updateObjectFromFormModel(obj, $scope.formModel);
								$scope.saveCacheGroup($http, obj);
							}
							else if ($scope.activeTabName == 'xmlfile') {
								$scope.uploadVisibleFile();								
							}
							else if ($scope.activeTabName == 'datfile') {
								$scope.uploadVisibleFile();
							}
							break;
						case "Cache":
							if ($scope.activeTabName == 'attr') {
								$scope.updateObjectFromFormModel(obj, $scope.formModel);
								$scope.saveCache($http, obj);
							}
							else if ($scope.activeTabName == 'targetImgfile') {
								$scope.uploadVisibleFile();
							}
							break;
					}
					$scope.setFormListClean();
				}
				else {
					console.log("nothing to save");
				}
			};
			
		$scope.createNewCity = 
			function(cityName) {
				console.log("New city: " + cityName);
				
				// create new city & insert it into browserList
				var city = Object();
				city.className = 'City';
				city.name = cityName;
				city.zip = '';
				city.country = '';
				city.cacheGroupList = new Array();
				
				// Post it to service
				var url = "http://" + $scope.proxy.restServer + "/cities";
				var json = $scope.deepEncodeJSON(city);
				$http.post(url,json).then(function(jsonResponse) {
					// extract new created city object
					var newCity = $scope.deepDecodeJSON(jsonResponse).data;
					city.id = newCity.id;
					$scope.browserList[0].push(city);
					$scope.setBrowserSelection(0, city);
				});
	
				// Clear dialog input
				$scope.dialogInput = null;
			};
			
		$scope.createNewCacheGroup = 
			function(cacheGroupName) {
				console.log("New cacheGroup: " + cacheGroupName);
				
				// get selected city
				var city = $scope.browserSelection[0];
				
				// create new cacheGroup & insert it into browserList
				var cacheGroup = Object();		
				cacheGroup.className = 'CacheGroup';
				cacheGroup.cityId = city.id;
				cacheGroup.name = cacheGroupName;
				cacheGroup.text = '';
				cacheGroup.targetImageDatFileName = '';
				cacheGroup.targetImageXmlFileName = '';
				cacheGroup.cacheList = new Array();
				
				// Post it to service
				var url = "http://" + $scope.proxy.restServer + "/cache-groups";
				var json = $scope.deepEncodeJSON(cacheGroup);
				$http.post(url,json).then(function(jsonResponse) {
					// extract new created cacheGroup object
					var newCacheGroup = $scope.deepDecodeJSON(jsonResponse).data;
					cacheGroup.id = newCacheGroup.id;
					$scope.browserList[1].push(cacheGroup);
					$scope.setBrowserSelection(1, cacheGroup);
				});
				
				// Clear dialog input
				$scope.dialogInput = null;
			};
				
		$scope.createNewCache = 
			function(cacheName) {
				console.log("New cache: " + cacheName);
				
				// get selected cacheGroup
				var cacheGroup = $scope.browserSelection[1];
				
				// create new cache & insert it into browserList
				var cache = Object();
				cache.className = 'Cache';
				cache.name = cacheName;
				cache.text = '';
				cache.street = '';
				cache.gpsLatitude = 0.0000000;
				cache.gpsLongitude = 0.0000000;
				cache.cacheGroupId = cacheGroup.id;
				
				// Post it to service
				var url = "http://" + $scope.proxy.restServer + "/caches";
				var json = $scope.deepEncodeJSON(cache);
				$http.post(url,json).then(function(jsonResponse) {
					// extract new created cache object
					var newCache = $scope.deepDecodeJSON(jsonResponse).data;
					cache.id = newCache.id;
					$scope.browserList[2].push(cache);
					$scope.setBrowserSelection(2, cache);
				});

				// Clear dialog input
				$scope.dialogInput = null;
			};
			
		$scope.uploadTargetImgFile =
			function(fileName, imageData, fileType, object) {

				//send file to REST service
				var imgFile = {"className": "File", "name": null, "mimeType": "image/*", "content": null};
				imgFile.name = $scope.encodeHtml(fileName);
				imgFile.content = $scope.encodeBase64(imageData);
				var url = "http://" + $scope.proxy.restServer + "/files/target-img/" + object.id;

				var res = $http.put(url, imgFile)
					.then(function(jsonResponse) {
						// update imgFile object
						imgFile = $scope.deepDecodeJSON(jsonResponse);
						
						// let image viewer show uploaded image
						$scope.targetImageURL = url;
						$scope.targetImageFile = imgFile;
						
					}, function errorCallback(response) {
					    // called asynchronously if an error occurs
					    // or server returns response with an error status.
						console.log("error uploading target image: " + response);
					}
				);
				
			};
				
		$scope.uploadXmlFile =
			function(fileName, fileData, fileType, object) {
				
				//send file to REST service
				var file = {"className": "File", "name": null, "mimeType": "application/json", "content": null};
				file.name = fileName;
				file.content = fileData;
				file = $scope.deepEncodeJSON(file);
						
				var url = "http://" + $scope.proxy.restServer + "/files/target-xml/";
				$scope.visibleFile = fileData;

				var res = $http.put(url, file);
			};
			
		$scope.uploadDatFile =
			function(fileName, imageData, fileType, object) {

				//send file to REST service
				var datFile = {"className": "File", "name": null, "mimeType": "application/json", "content": null};
				datFile.name = $scope.encodeHtml(fileName);
				datFile.content = $scope.encodeBase64(imageData);
				var url = "http://" + $scope.proxy.restServer + "/files/target-dat/" + object.id;

				var res = $http.put(url, datFile)
					.then(function(jsonResponse) {
						// update dat file object
						datFile = $scope.deepDecodeJSON(jsonResponse);
						
						// let image viewer show uploaded image
						$scope.targetImageURL = url;
						$scope.targetImageFile = datFile;
						
					}, function errorCallback(response) {
					    // called asynchronously if an error occurs
					    // or server returns response with an error status.
						console.log("error uploading target image dat file: " + response);
					}
				);
				
			};
				
		$scope.uploadVisibleFile =
			function() {
				var object = $scope.selectedObject();

				if (angular.isObject(object)) {
					var file = $scope.uploadDialogModel.getSelectedFile();
					var fileReader = new FileReader();
					
					if ($scope.activeTabName == 'xmlfile') {
						// Its an .xml file
						fileReader.onloadend = function() {
							// Validate file
							
							// Upload text file
							var fileName = file.name;
							var textData = fileReader.result;
							var fileType = $scope.visibleFileType;
							$scope.uploadXmlFile(fileName, textData, fileType, object);
						}
						
						fileReader.readAsText(file);
					
					} else if ($scope.activeTabName == 'datfile') {
							// Its an .dat file
							fileReader.onloadend = function() {
								// Validate file
								
								// Upload binary file
								var fileName = file.name;
								var binData = fileReader.result;
								var fileType = $scope.visibleFileType;
								$scope.uploadDatFile(fileName, binData, fileType, object);
							}
							
							fileReader.readAsArrayBuffer(file);	
							
					} else if ($scope.activeTabName == 'targetImgfile') {
						// It's an image file (.jpg, .png)
						fileReader.onloadend = function() {

							// Upload image file
							var fileName = file.name;
							var imageData = fileReader.result;
							var fileType = $scope.visibleFileType;
							$scope.uploadTargetImgFile(fileName, imageData, fileType, object);
						}
						
						fileReader.readAsArrayBuffer(file);	
					}
					
					$scope.selectedFile = null;
				};
			};
			

		$scope.setupFileUploadDialogModel = 
			function () {
				$scope.uploadDialogModel = rmFileUploadDialogs.FileUploadModelBuilder()
											 .setUploadCallback($scope.uploadVisibleFile);
			};
			
		$scope.setupFileUploadDialogModel();
			
		$scope.deleteCity =
			function(city) {
			
				deleteCityWithId = function(cityId) {
					// Delete city via service
					var url = "http://" + $scope.proxy.restServer + "/cities/" + cityId;
					$http.delete(url).then(function(jsonResponse) {
						// remove city in browser list
						var idx = $scope.browserList[0].indexOf(city);
						$scope.browserList[0].splice(idx,1);
						$scope.setBrowserSelection(0, null);
					});
				};
			
				console.log("Delete city: " + city.name);
				
				if (city == null || city.id == -1)
					return;   // nothing to do
				
				var cacheGroupCnt = city.cacheGroupList.length;
				
				if (cacheGroupCnt > 0) {
					// Delete all cacheGroups first and then delete city (in callback of last cacheGroup delete)
					for (idx in city.cacheGroupList) {
						$scope.deleteCacheGroup(city.cacheGroupList[idx], function() {
							// callback function
							cacheGroupCnt--;
							if (cacheGroupCnt == 0) {
								deleteCityWithId(city.id);
							}
						});
					}
				} else {
					deleteCityWithId(city.id);
				}
			};
				
		$scope.deleteCacheGroup =
			function(cacheGroup, callbackFct) {
			
				deleteCacheGroupWithId = function(cacheGroupId) {
					// Delete cacheGroup via service
					var url = "http://" + $scope.proxy.restServer + "/cache-groups/" + cacheGroupId;
					$http.delete(url).then(function(jsonResponse) {
						// remove cacheGroup in browser list
						var idx = $scope.browserList[1].indexOf(cacheGroup);
						$scope.browserList[1].splice(idx,1);
						$scope.setBrowserSelection(1, null);
						
						// do callback
						if (callbackFct != null)
							callbackFct();
					});
				};
			
				console.log("Delete cacheGroup: " + cacheGroup.name);
				
				if (cacheGroup == null || cacheGroup.id == -1)
					return;   // nothing to do
				
				var cacheCnt = cacheGroup.cacheList.length;
				
				if (cacheCnt > 0) {
					// Delete all caches first and then delete cacheGroup (in callback of last cache delete)
					for (idx in cacheGroup.cacheList) {
						$scope.deleteCache(cacheGroup.cacheList[idx], function() {
							// callback function
							cacheCnt--;
							if (cacheCnt == 0) {
								deleteCacheGroupWithId(cacheGroup.id);
							}
						});
					}
				} else {
					deleteCacheGroupWithId(cacheGroup.id);
				}
				
			};
				
		$scope.deleteCache =
			function(cache, callbackFct) {
				console.log("Delete cache: " + cache.name);
				
				if (cache == null || cache.id == -1)
					return;   // nothing to do
				
				// Delete cache via service
				var url = "http://" + $scope.proxy.restServer + "/caches/" + cache.id;
				$http.delete(url).then(function(jsonResponse) {
					// remove cache in browser list
					var idx = $scope.browserList[2].indexOf(cache);
					$scope.browserList[2].splice(idx,1);
					$scope.setBrowserSelection(2, null);
					
					if (callbackFct != null)
						callbackFct();
				});

			};
			
			$scope.uploadXmlFile =
				function(fileName, fileData, fileType, cacheGroupId) {
					
					//send file to REST service
					var file = {"className": "File", "name": null, "mimeType": "application/json", "content": null};
					file.name = fileName;
					file.content = fileData;
					file = $scope.deepEncodeJSON(file);
							
					var url = "http://" + $scope.proxy.restServer + "/files/xml" + cacheGroupId;
					
					$scope.xmlFile = fileData;
					$scope.visibleFile = fileData;

					var res = $http.put(url, file);
				};
			
}])


<!-- Directives ----------------------------------------------------------------------------------------->

<!-- Directive to autom. size height of a textarea element -->
.directive('rmElastic', ['$timeout', function($timeout) {
	return {
		restrict: 'A',
			link: function($scope, element) {
				$scope.initialHeight = $scope.initialHeight || element[0].style.height;
				var resize = function() {
					element[0].style.height = $scope.initialHeight;
					element[0].style.height = "" + element[0].scrollHeight + "px";
				};
				element.on("input change", resize);
				$timeout(resize, 0);
			}
		};
	}
])
   
<!-- Directive to compile dynamically created elements -->
.directive('rmCompile', function($compile, $timeout){
	return{
		restrict:'A',
			link: function(scope,elem,attrs){
				$timeout(function(){                
                $compile(elem.contents())(scope);    
            });
        }        
    };
});