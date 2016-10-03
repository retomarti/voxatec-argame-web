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
		    	var txt = document.createElement("textarea");
		    	txt.value = string;
				return txt.html();
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
				console.log("setActiveFormDirty");
				console.log($scope.activeForm);
			};
			
		$scope.setActiveFormClean = 
			function() {
				$scope.activeForm.isDirty = false;
				console.log("setActiveFormClean");
				console.log($scope.activeForm);
			}
			
		$scope.isActiveFormDirty = 
			function() {
				return $scope.activeForm != undefined && $scope.activeForm != null &&
				       $scope.activeForm.hasOwnProperty('isDirty') && $scope.activeForm.isDirty;
			};
					
		$scope.saveActiveForm = 
			function() {
				if ($scope.isActiveFormDirty()) {
					console.log("saving active form");
					$scope.setActiveFormClean();
				}
				else {
					console.log("nothing to save");
				}
			};
			
		$scope.setFormFieldsInForm =
			function(object, formNr) {
				// Create form fields
				visibleProps = ['id','name','text', 'riddle', 'challengeText', 'responseText', 'hintText'];
				readOnlyProps = ['id'];
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
				
		$scope.setFormFields =
			function(object) {
				if ($scope.isActiveFormDirty()) {
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
			
		$scope.doInitRequest = 
			function($http) {
				$http.get("http://localhost:9090/argame/adventure-scenes").success(function(jsonResponse) {
					$scope.browserList[0] = jsonResponse;
					$scope.setBrowserSelection(0, jsonResponse[0]);
				});
			};
			
		// Do initial request for model
		$scope.doInitRequest($http);
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