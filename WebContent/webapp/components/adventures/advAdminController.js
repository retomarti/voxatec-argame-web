var ARGameApp=angular.module("ARGameApp", ['ngSanitize']);


<!-- Browser Controller --------------------------------------------------------------------------------->
ARGameApp.controller('BrowserCtrl', ['$scope', '$sce', '$http',
	function($scope, $sce, $http) {
	
		<!-- Adventure Browser Model -->
		$scope.proxy = null;
		$scope.prototypes = new Object();
		$scope.object3DList = new Array();	  // object3D list used for object3D selection in scenes
		
		$scope.browserList = new Array();
		$scope.browserSelection = new Array();
				
		$scope.formLayoutRules = new Array(); // objects loaded from the layout-rules.json file
		$scope.formObjectList = new Array();  // list of objects represented by the formLists
		$scope.formList = new Array();		  // forms containing visible fields of objects in formObjectList
		$scope.activeForm = null;			  // currently active form
		
		$scope.dialogInput = null;			  // value entered by user in input forms
		
		<!-- Methods ----------------------------------------------------------------------->
		
		$scope.doInitRequest = 
			function($http) {
				// Get proxy definition
				var url = "./webapp/shared/config/proxy.json";
				$http.get(url).success(function(jsonResponse) {
					$scope.proxy = $scope.deepDecodeJSON(jsonResponse);
					
					// Get all entity prototypes
					var url = "http://" + $scope.proxy.restServer + "/prototypes";
					$http.get(url).success(function(jsonResponse) {
						var advPrototype = $scope.deepDecodeJSON(jsonResponse);
						$scope.extractPrototypes(advPrototype);
					});
					
					// Get all object3D entities
					url = "http://" + $scope.proxy.restServer + "/objects3D";
					$http.get(url).success(function(jsonResponse) {
						$scope.object3DList = $scope.deepDecodeJSON(jsonResponse);
					});
					
					// Get all adventures, stories & scenes entities
					url = "http://" + $scope.proxy.restServer + "/adventure-scenes";
					$http.get(url).success(function(jsonResponse) {
						// Extract adventure list
						var adventures = $scope.deepDecodeJSON(jsonResponse);
						$scope.browserList[0] = adventures;
						$scope.addMissingPrototypeFields(adventures);
						
						// Set browser selection
						var sel = $scope.browserList[0][0];
						$scope.setBrowserSelection(0, sel);
					});

				});
			
				// Get the object layout rules
				var url = "./webapp/shared/layouts/layout-rules.json";
				$http.get(url).success(function(jsonResponse) {
					$scope.formLayoutRules = jsonResponse;
				});
				
			};
			
		// Do initial request for model
		$scope.doInitRequest($http);
		
		$scope.extractPrototypes = 
			function(object) {
				
				// Register prototype object with its className
				if (angular.isDefined(object.className)) {
					$scope.prototypes[object.className] = object;
				}
				
				// Traverse recursively object tree
				for (var propName in object) {
					if(angular.isObject(object[propName])) {
						$scope.extractPrototypes(object[propName]);
					}
			    }	
			};
			
		$scope.addMissingPrototypeFields =
			function(object) {

				if (angular.isObject(object)) {
					if (angular.isDefined(object.className)) {
						var prototype = $scope.prototypes[object.className];
						for (propName in prototype) {
							if (angular.isObject(prototype[propName])) {
								if (object[propName] == 'undefined' || object[propName] == null) {
									object[propName] = prototype[propName];
								}
							}
						}
					}
					
					for (propName in object) {
						if (angular.isDefined(object[propName])) {
							if (angular.isObject(object[propName])) {
								$scope.addMissingPrototypeFields(object[propName]);
							}
						}
					}
				}
			};

		$scope.isString = 
			function(value) {
				return angular.isString(value);
			};

		$scope.isNumber = 
			function(value) {
				return angular.isNumber(value);
			};
			
		$scope.isDropDown =
			function(value) {
				return false;
			};
			
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
				objectTypes = ['Adventure','Story','Scene'];
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
			
		$scope.objectLayoutRule = 
			function(object) {
				var rule = null;
				if (angular.isDefined(object) && angular.isDefined(object.className)) {
					rule = $scope.formLayoutRules[object.className].rule;
				}
				return rule;
			};
			
		$scope.objectVisibleFields =
			function(object) {
				var visibleFields = null;
				if (angular.isDefined(object.className)) {
					visibleFields = $scope.formLayoutRules[object.className].visibleFields;
				}
				return visibleFields;
			};
			
		$scope.objectReadOnlyFields =
			function(object) {
				var readOnlyFields = null;
				if (angular.isDefined(object.className)) {
					readOnlyFields = $scope.formLayoutRules[object.className].readOnlyFields;
				}
				return readOnlyFields;
			};
				
		$scope.setActiveForm =
			function(formNr) {
				if (formNr >= 0) {
					$scope.activeForm = $scope.formList[formNr];
				}
			};
			
		$scope.activeFormNr = 
			function() {
				var formNr=0;
				while (formNr <= 2 && $scope.activeForm != $scope.formList[formNr]) {
					formNr++;
				}
				if (formNr <= 2)
					return formNr;
				else
					return -1;
			};
			
		$scope.isActiveForm = 
			function(formNr) {
				return $scope.activeForm != undefined && $scope.activeForm != null && $scope.activeForm === $scope.formList[formNr];
			};
			
		$scope.setActiveFormDirty = 
			function() {
				$scope.activeForm.isDirty = true;
			};
			
		$scope.isFormListDirty = 
			function() {
				// Check whether a form is marked as dirty
				var isDirty = false;
				for (formIdx in $scope.formList) {
					isDirty = isDirty || ($scope.formList[formIdx].hasOwnProperty('isDirty') && $scope.formList[formIdx].isDirty);
				}
				return isDirty;
			};
				
		$scope.setFormListClean = 
			function() {
				for (formIdx in $scope.formList) {
					$scope.formList[formIdx].isDirty = false;
				}
			}
		
		$scope.resetFormList = 
			function() {
				$scope.formObjectList = new Array();
				$scope.formList = new Array();
				$scope.activeForm = null;
				$scope.setFormListClean;
			};
		
		$scope.setFormFieldsInForm =
			function(object, formNr) {
				// Create form fields
				var visibleFields = $scope.objectVisibleFields(object);
				var readOnlyFields = $scope.objectReadOnlyFields(object);
				var form = new Array();
				var fNr = formNr;

				// Put visible properties into form
				fieldNr = 0;
				for (propName in object) {					
					// Property visible to user?
					if (visibleFields.includes(propName)) {
						if (angular.isObject(object[propName])) {
							if (object[propName] != "undefined" && object[propName] != null) {
								$scope.setFormFieldsInForm(object[propName], fNr+1);
								fNr++;
							}
						}
						else {
							field = new Object();
							field.name  = propName;
							field.value = object[propName];
							field.readonly = readOnlyFields.includes(propName);
							form[fieldNr] = field;
							fieldNr++;
						}
					}
				}
								
				// Update form
				$scope.formList[formNr] = form;
				$scope.formObjectList[formNr] = object;
			};
			
		$scope.formFieldWithName = 
			function(form, fieldName) {
				for (fieldIdx in form) {
					var field = form[fieldIdx];
					if (field.name == fieldName) {
						return field;
					}
				}
			}
				
		$scope.setFormFields =
			function(object) {
				if ($scope.isFormListDirty()) {
					console.log("ask user to save active form first");
				}
				$scope.formList = new Array();
				$scope.setFormFieldsInForm(object, 0);
				$scope.setActiveForm(0);
			};
			
		$scope.setFormObject =
			function(object, formNr) {				
				$scope.setFormFieldsInForm(object, formNr);
				$scope.setActiveForm(formNr);
				$scope.setActiveFormDirty();
			};
			
		$scope.resetBrowserSelection =
			function () {
				$scope.browserSelection = new Array();
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
							$scope.browserList[1] = selectedObject.storyList;
							$scope.browserList[2] = null;
							$scope.browserSelection[1] = null;
							$scope.browserSelection[2] = null;
						}
						else if (inListNr==1) {
							$scope.browserList[2] = selectedObject.sceneList;
							$scope.browserSelection[2] = null;
						}
						// Set form content
						$scope.setFormFields(selectedObject);
					}
 				}
			};
			
		$scope.saveAdventure =
			function($http, adventure) {
				var json = angular.toJson(adventure, false);
				json = $scope.deepEncodeJSON(json);
				
				if (adventure.id == null || adventure.id == -1) {
					var url = "http://" + $scope.proxy.restServer + "/adventures";
					var res = $http.post(url, json);		
				}
				else {
					var url = "http://" + + $scope.proxy.restServer + "/adventures/" + adventure.id;
					var res = $http.put(url, json);
				}
				console.log(res);
			};
			
		$scope.saveStory = 
			function($http, story) {
				var json = angular.toJson(story, false);
				json = $scope.deepEncodeJSON(json);
				
				if (story.id == null || story.id == -1) {
					var url = "http://" + $scope.proxy.restServer + "/stories";
					var res = $http.post(url, json);					
				}
				else {
					var url = "http://" + $scope.proxy.restServer + "/stories/" + story.id;
					var res = $http.put(url, json);
				}
				console.log(res);
			};
			
		$scope.saveScene = 
			function($http, scene) {
				var json = angular.toJson(scene, false);
				json = $scope.deepEncodeJSON(json);
				
				if (scene.id == null || scene.id == -1) {
					var url = "http://" + $scope.proxy.restServer + "/scenes";
					var res = $http.post(url, json);					
				}
				else {
					var url = "http://" + $scope.proxy.restServer + "/scenes/" + scene.id;
					var res = $http.put(url, json);
				}
				console.log(res);
			};
			
		$scope.updateObjectWithForm = 
			function(object, formNr) {
				// Update object with form field values
				var visibleFields = $scope.objectVisibleFields(object);
				var form = $scope.formList[formNr];
				var layoutRule = $scope.objectLayoutRule(object);
				var fNr = formNr;

				fieldNr = 0;
				for (property in object) {					
					// Property visible to user?
					if (visibleFields.includes(property)) {
						if (angular.isObject(object[property])) {
							if (object[property] != "undefined" && object[property] != "null") {
								$scope.updateObjectWithForm(object[property], fNr+1);
								fNr++;
							}
						}
						else {
							var field = $scope.formFieldWithName(form, property);
							if (angular.isDefined(field) && (!field.readonly || layoutRule == 'showSelector')) {
								object[property] = field.value;
							}
						}
					}
				}
			};
			
		$scope.updateObjectWithFormList =
			function(object) {
				$scope.updateObjectWithForm(object, 0);
			};
			
		$scope.saveSelectedObject = 
			function() {
				if ($scope.isFormListDirty()) {
					console.log("saving selected object");
					
					var obj = $scope.selectedObject();
					
					switch ($scope.selectedObjectType()) {
						case "Adventure":
							$scope.updateObjectWithFormList(obj);
							$scope.saveAdventure($http, obj);
							break;
						case "Story":
							$scope.updateObjectWithFormList(obj);
							$scope.saveStory($http, obj);
							break;
						case "Scene":
							$scope.updateObjectWithFormList(obj);
							$scope.saveScene($http, obj);
							break;
					}
					$scope.setFormListClean();
				}
				else {
					console.log("nothing to save");
				}
			};
			
		$scope.createNewAdventure = 
			function(adventureName) {
				console.log("New adventure: " + adventureName);
				
				// create new adventure & insert it into browserList
				var advPrototype = $scope.prototypes["Adventure"];
				var adventure = (JSON.parse(JSON.stringify(advPrototype)));	// clone prototype instance

				adventure.name = adventureName;
				adventure.storyList = new Array();
				
				// Post it to service
				var url = "http://" + $scope.proxy.restServer + "/adventures";
				var json = $scope.deepEncodeJSON(adventure);
				$http.post(url,json).then(function(jsonResponse) {
					// extract new created adventure object
					var newAdventure = $scope.deepDecodeJSON(jsonResponse).data;
					adventure.id = newAdventure.id;
					$scope.browserList[0].push(adventure);
					$scope.setBrowserSelection(0, adventure);
				});
	
				// Clear dialog input
				$scope.dialogInput = null;
			};
			
		$scope.createNewStory = 
			function(storyName) {
				console.log("New story: " + storyName);
				
				// get selected adventure
				var adventure = $scope.browserSelection[0];
				
				// create new story & insert it into browserList
				var storyPrototype = $scope.prototypes["Story"];
				var story = (JSON.parse(JSON.stringify(storyPrototype)));	// clone prototype instance
				var len = $scope.browserList[1].length;
				
				story.adventureId = adventure.id;
				story.name = storyName;
				story.seqNr = len + 1;
				story.sceneList = new Array();
				
				// Post it to service
				var url = "http://" + $scope.proxy.restServer + "/stories";
				var json = $scope.deepEncodeJSON(story);
				$http.post(url,json).then(function(jsonResponse) {
					// extract new created story object
					var newStory = $scope.deepDecodeJSON(jsonResponse).data;
					story.id = newStory.id;
					$scope.browserList[1].push(story);
					$scope.setBrowserSelection(1, story);
				});
				
				// Clear dialog input
				$scope.dialogInput = null;
			};
				
		$scope.createNewScene = 
			function(sceneName) {
				console.log("New scene: " + sceneName);
				
				// get selected story
				var story = $scope.browserSelection[1];
				
				// create new scene & insert it into browserList
				var scenePrototype = $scope.prototypes["Scene"];
				var scene = (JSON.parse(JSON.stringify(scenePrototype)));	// clone prototype instance
				var len = $scope.browserList[2].length;
				
				scene.name = sceneName;
				scene.storyId = story.id;
				scene.seqNr = len + 1;
				// scene.object3D = null;
				// scene.riddle = null;
				
				// Post it to service
				var url = "http://" + $scope.proxy.restServer + "/scenes";
				var json = $scope.deepEncodeJSON(scene);
				$http.post(url,json).then(function(jsonResponse) {
					// extract new created scene object
					var newScene = $scope.deepDecodeJSON(jsonResponse).data;
					scene.id = newScene.id;
					$scope.browserList[2].push(scene);
					$scope.setBrowserSelection(2, scene);
				});

				// Clear dialog input
				$scope.dialogInput = null;
			};
			
		$scope.deleteAdventure =
			function(adventure) {
			
				deleteAdventureWithId = function(adventureId) {
					// Delete adventure via service
					var url = "http://" + $scope.proxy.restServer + "/adventures/" + adventureId;
					$http.delete(url).then(function(jsonResponse) {
						// remove adventure in browser list
						var idx = $scope.browserList[0].indexOf(adventure);
						$scope.browserList[0].splice(idx,1);
						$scope.setBrowserSelection(0, null);
					});
				};
			
				console.log("Delete adventure: " + adventure.name);
				
				if (adventure == null || adventure.id == -1)
					return;   // nothing to do
				
				var storyCnt = adventure.storyList.length;
				
				if (storyCnt > 0) {
					// Delete all stories first and then delete adventure (in callback of last story delete)
					for (idx in adventure.storyList) {
						$scope.deleteStory(adventure.storyList[idx], function() {
							// callback function
							storyCnt--;
							if (storyCnt == 0) {
								deleteAdventureWithId(adventure.id);
							}
						});
					}
				} else {
					deleteAdventureWithId(adventure.id);
				}
			};
				
		$scope.deleteStory =
			function(story, callbackFct) {
			
				deleteStoryWithId = function(storyId) {
					// Delete story via service
					var url = "http://" + $scope.proxy.restServer + "/stories/" + storyId;
					$http.delete(url).then(function(jsonResponse) {
						// remove story in browser list
						var idx = $scope.browserList[1].indexOf(story);
						$scope.browserList[1].splice(idx,1);
						$scope.setBrowserSelection(1, null);
						
						// do callback
						if (callbackFct != null)
							callbackFct();
					});
				};
			
				console.log("Delete story: " + story.name);
				
				if (story == null || story.id == -1)
					return;   // nothing to do
				
				var sceneCnt = story.sceneList.length;
				
				if (sceneCnt > 0) {
					// Delete all scenes first and then delete story (in callback of last scene delete)
					for (idx in story.sceneList) {
						$scope.deleteScene(story.sceneList[idx], function() {
							// callback function
							sceneCnt--;
							if (sceneCnt == 0) {
								deleteStoryWithId(story.id);
							}
						});
					}
				} else {
					deleteStoryWithId(story.id);
				}
				
			};
				
		$scope.deleteScene =
			function(scene, callbackFct) {
				console.log("Delete scene: " + scene.name);
				
				if (scene == null || scene.id == -1)
					return;   // nothing to do
				
				// Delete via service
				var url = "http://" + $scope.proxy.restServer + "/scenes/" + scene.id;
				$http.delete(url).then(function(jsonResponse) {
					// remove scene in browser list
					var idx = $scope.browserList[2].indexOf(scene);
					$scope.browserList[2].splice(idx,1);
					$scope.setBrowserSelection(2, null);
					
					if (callbackFct != null)
						callbackFct();
				});

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