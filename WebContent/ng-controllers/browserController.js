var ARGameApp=angular.module("ARGameApp", ['ngSanitize']);


<!-- Browser Controller --------------------------------------------------------------------------------->
ARGameApp.controller('BrowserCtrl', ['$scope', '$sce', '$http',
	function($scope, $sce, $http) {
	
		<!-- Adventure Browser Model -->
		$scope.prototypes = new Object();
		$scope.browserList = new Array();
		$scope.browserSelection = new Array();
		$scope.formNameList = new Array();
		$scope.formList = new Array();
		$scope.activeForm = null;
		$scope.dialogInput = null;
		
		<!-- Methods ----------------------------------------------------------------------->
		
		$scope.doInitRequest = 
			function($http) {
				// Get all entity prototypes
				var url = "http://" + window.location.hostname + ":9090/argame/prototypes";
				$http.get(url).success(function(jsonResponse) {
					var advPrototype = $scope.deepDecodeJSON(jsonResponse);
					$scope.extractPrototypes(advPrototype);
				});
				
				// Get all adventures & scenes
				url = "http://" + window.location.hostname + ":9090/argame/adventure-scenes";
				$http.get(url).success(function(jsonResponse) {
					// Extract adventure list
					var adventures = $scope.deepDecodeJSON(jsonResponse);
					$scope.browserList[0] = adventures;
					$scope.addMissingPrototypeFields(adventures);
					
					// Set browser selection
					var sel = $scope.browserList[0][0];
					$scope.setBrowserSelection(0, sel);
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
			function(aString) {
				return angular.isString(aString);
			};

		$scope.isNumber = 
			function(aString) {
				return angular.isNumber(aString);
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
			
		$scope.setActiveForm =
			function(formNr) {
				if (formNr >= 0) {
					$scope.activeForm = $scope.formList[formNr];
				}
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
		
		$scope.setFormFieldsInForm =
			function(object, formNr) {
				// Create form fields
				var visibleProps = ['id','name','text', 'riddle', 'challengeText', 'responseText', 'hintText', 'object3D'];
				var readOnlyProps = ['id'];
				var form = new Array();
				var fNr = formNr;

				// Put visible properties into form
				fieldNr = 0;
				for (propName in object) {					
					// Property visible to user?
					if (visibleProps.includes(propName)) {
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
							field.readonly = readOnlyProps.includes(propName);
							form[fieldNr] = field;
							fieldNr++;
						}
					}
				}
								
				// Update form
				$scope.formList[formNr] = form;
				$scope.formNameList[formNr] = object.className;
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
			
		$scope.setBrowserSelection =
			function(inListNr, selectedObject) {
				if (inListNr >=0 && inListNr <=2) {
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
			};
			
		$scope.saveAdventure =
			function($http, adventure) {
				var json = angular.toJson(adventure, false);
				json = $scope.deepEncodeJSON(json);
				
				if (adventure.id == null || adventure.id == -1) {
					var url = "http://" + window.location.hostname + ":9090/argame/adventures";
					var res = $http.post(url, json);					
				}
				else {
					var url = "http://localhost:9090/argame/adventures/" + adventure.id;
					var res = $http.put(url, json);
				}
				console.log(res);
			};
			
		$scope.saveStory = 
			function($http, story) {
				var json = angular.toJson(story, false);
				json = $scope.deepEncodeJSON(json);
				
				if (story.id == null || story.id == -1) {
					var url = "http://" + window.location.hostname + ":9090/argame/stories";
					var res = $http.post(url, json);					
				}
				else {
					var url = "http://" + window.location.hostname + ":9090/argame/stories/" + story.id;
					var res = $http.put(url, json);
				}
				console.log(res);
			};
			
		$scope.saveScene = 
			function($http, scene) {
				var json = angular.toJson(scene, false);
				json = $scope.deepEncodeJSON(json);
				
				if (scene.id == null || scene.id == -1) {
					var url = "http://" + window.location.hostname + ":9090/argame/scenes";
					var res = $http.post(url, json);					
				}
				else {
					var url = "http://" + window.location.hostname + ":9090/argame/scenes/" + scene.id;
					var res = $http.put(url, json);
				}
				console.log(res);
			};
			
		$scope.updateObjectWithForm = 
			function(object, formNr) {
				// Update object with form field values
				var visibleProps = ['id','name','text', 'riddle', 'challengeText', 'responseText', 'hintText'];
				var readOnlyProps = ['id'];
				var form = $scope.formList[formNr];

				fieldNr = 0;
				for (property in object) {					
					// Property visible to user?
					if (visibleProps.includes(property)) {
						if (angular.isObject(object[property])) {
							if (object[property] != "undefined" && object[property] != "null") {
								$scope.updateObjectWithForm(object[property], formNr+1);
							}
						}
						else {
							var field = $scope.formFieldWithName(form, property);
							if (!field.readonly) {
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
				var adventure = {"className": "Adventure",
							     "id": null, 
							     "name": adventureName, 
							     "text": ""
							    };
				$scope.browserList[0].push(adventure);
				var len = $scope.browserList[0].length;
				$scope.setBrowserSelection(0, adventure);
				
				// Clear dialog input
				$scope.dialogInput = null;
			};
			
		$scope.createNewStory = 
			function(storyName) {
				console.log("New story: " + storyName);
				
				// get selected story
				var adventure = $scope.browserSelection[0];
				
				// create new story & insert it into browserList
				var len = $scope.browserList[1].length;
				var seqNr = len + 1;
				var story = {"className": "Story",
							 "id": null, 
						     "adventureId": adventure.id, 
						     "name": storyName, 
						     "text": "", 
						     "seqNr": seqNr};
				$scope.browserList[1].push(story);
				$scope.setBrowserSelection(1, story);
				
				// Clear dialog input
				$scope.dialogInput = null;
			};
				
		$scope.createNewScene = 
			function(sceneName) {
				console.log("New scene: " + sceneName);
				
				// get selected story
				var story = $scope.browserSelection[1];
				
				// create new scene & insert it into browserList
				var len = $scope.browserList[2].length;
				var seqNr = len + 1;
				var scene = {"className": "Scene",
							 "id": null, 
						     "storyId": story.id, 
						     "name": sceneName, 
						     "text": "", 
						     "seqNr": seqNr,
						     "riddle": {"id": null, "challengeText": "", "responseText":"", "hintText":""},
						     "object3D": {"id": null, "name": "", "text":""}
						    };
				$scope.browserList[2].push(scene);
				$scope.setBrowserSelection(2, scene);
				
				// Clear dialog input
				$scope.dialogInput = null;
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