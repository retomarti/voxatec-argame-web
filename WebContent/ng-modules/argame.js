var ARGameApp=angular.module("ARGameApp", ['ngSanitize']);


<!-- Controller -->
ARGameApp.controller('ARGameCtrl', ['$scope', '$sce', '$http',
	function($scope, $sce, $http) {
	
		<!-- Adventure Browser Model -->
		$scope.browserList = new Array();
		$scope.browserSelection = new Array();
		$scope.formList = new Array();
		$scope.activeForm = null;
		
		<!-- Methods -->
		$scope.doInitRequest = 
			function($http) {
				$http.get("http://localhost:9090/argame/adventure-scenes").success(function(jsonResponse) {
					$scope.browserList[0] = jsonResponse;
					$scope.setBrowserSelection(0, jsonResponse[0]);
				});
			};
			
		// Do initial request for model
		$scope.doInitRequest($http);

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
				var visibleProps = ['id','name','text', 'riddle', 'challengeText', 'responseText', 'hintText'];
				var readOnlyProps = ['id'];
				var form = new Array();

				fieldNr = 0;
				for (property in object) {					
					// Property visible to user?
					if (visibleProps.includes(property)) {
						if (angular.isObject(object[property])) {
							if (object[property] != "undefined" && object[property] != "null") {
								$scope.setFormFieldsInForm(object[property], formNr+1);
							}
						}
						else {
							field = new Object();
							field.name  = property;
							field.value = $scope.decodeHtml(object[property]);
							field.readonly = readOnlyProps.includes(property);
							form[fieldNr] = field;
							fieldNr++;
						}
					}
				}
				// Update form
				$scope.formList[formNr] = form;
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
				var url = "http://localhost:9090/argame/adventures/" + adventure.id;
				var res = $http.put(url, json);
				console.log(res);
			};
			
		$scope.saveStory = 
			function($http, story) {
				var json = angular.toJson(story, false);
				var url = "http://localhost:9090/argame/stories/" + story.id;
				var res = $http.put(url, json);
				console.log(res);
			};
			
		$scope.saveScene = 
			function($http, scene) {
				var json = angular.toJson(scene, false);
				var url = "http://localhost:9090/argame/scenes/" + scene.id;
				var res = $http.put(url, json);
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
								if ($scope.isString(field.value)) {
									object[property] = $scope.encodeHtml(field.value);
								}
								else {
									object[property] = field.value;
								}
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
	}
])

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