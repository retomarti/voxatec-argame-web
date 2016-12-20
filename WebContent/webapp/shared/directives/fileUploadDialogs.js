var rmFileUploadDialogs=angular.module("rmFileUploadDialogs", []);

/**
 * Directive to ask user to upload a file 
 * - usage:   		<rm-file-upload-dialog dialogModel="<$scope-yourUplDialogModel>"></rm-file-upload-dialog>    
 * - attribute:		yourFormModel containing the dialog fields
 * 
 * Hint: use rmFileUploadDialog.FileUploadModelBuilder to create the model in your controller class.
 */         

rmFileUploadDialogs.FileUploadModelBuilder = function() {
	return {
		/* private */
		uploadCallback: null,   	// function()
		selectedFile: null,			// file object selected by user
			
		/*-- Private methods ----------------------------------------------------*/
		'bindFileVariable': function() {
			var fileElem = document.getElementById('uploadFile');
			if (fileElem != null) {
				this.selectedFile = fileElem.files[0];
			}
			else {
				console.log('FileUploadModelBuilder: could not find upload element in DOM tree');
			}
		},
		
		'resetDialog': function() {
			
		},
		
		/*-- Accessors -----------------------------------------------------------*/

		'setUploadCallback': function(callback) {	
			if (angular.isFunction(callback)) {
				this.uploadCallback = callback;
			}
			else {
				console.log('File upload dialog: callback is not a function');
			}
			return this;
		},
		
		'getSelectedFile': function() {
			return this.selectedFile;
		},
		
		/*-- Event handlers ------------------------------------------------------*/

		'doUpload': function() {
			if (this.uploadCallback != null) {
				this.bindFileVariable();
				this.uploadCallback();
			}
		}
		
	}
};
	
rmFileUploadDialogs.directive('rmFileUploadDialog', function() {
	var directive = {};

	directive.restrict = 'E';	// restrict directive to elements
	directive.templateUrl = "./webapp/shared/directives/fileUploadDialogTemplate.html";
	
	directive.scope = {
		uploadDialogModel: "=uploadDialogModel"
	}
		
	return directive;
})
   