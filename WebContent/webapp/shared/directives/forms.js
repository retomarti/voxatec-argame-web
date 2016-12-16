var rmForms=angular.module("rmForms", []);

/**
 * Directive to render a form representing a given object 
 * - usage:   		<rm-form formModel="<$scope-yourFormModel>"></rm-form>    
 * - attribute:		yourFormModel containing the form object + metadata for displaying/editing the form
 * 
 * Hint: use rmForms.FormModelBuilder to create the form model in your controller class.
 */         

rmForms.FormModelBuilder = function() {
	return {
		/* public */
		tabs: Array(),		// every tab is an object like {'name': string, fields: Array}
		activeTab: null,	// current active tab for editing
			
		/*-- Constructor --------------------------------------------*/
		
		/* public */
		'addTab': function(tabName) {
			if (!angular.isDefined(tabName) || tabName == null) {
				console.log("FormModelBuilder: addTab requires defined tabName");
				return;
			}
			
			// Create new tabs
			var tab = Object();
			tab.name = tabName;
			tab.fields = Array();
			this.tabs.push(tab);
			
			return this;
		},
		
		'currentTab': function() {
			var tabCnt = this.tabs.length;
			var tab = this.tabs[tabCnt-1];
			return tab;
		},
		
		'addField': function(key, label, value, valueType, readOnly) {
			if (!angular.isDefined(key) || key == null) {
				console.log("FormModelBuilder: addField requires defined key");
				return;
			}
			// add field to last tab
			var field = {'type': 'singleValueField', 
					     'key': key, 
					     'label': label, 
					     'value': value, 
					     'valueType': valueType,	// String, Number, Text
					     'readOnly': readOnly, 
					     'dirty': false
					     };
			var tab = this.currentTab();
			tab.fields.push(field);
			
			return this;
		},
		
		'addStringField': function(key, label, value, readOnly) {
			return this.addField(key, label, value, 'String', readOnly);
		},
		
		'addNumberField': function(key, label, value, readOnly) {
			return this.addField(key, label, value, 'Number', readOnly);
		},
		
		'addTextField': function(key, label, value, readOnly) {
			return this.addField(key, label, value, 'Text', readOnly);
		},
		
		'getFieldWithKey': function(key, tab)	{
			for (idx in tab.fields) {
				var field = tab.fields[idx];
				if (field.key == key) {
					return field;
				}
			}
			return null;
		},
		
		'addDropdownList': function(key, label, value, valueList, valueListProperty, readOnly) {
			if (!angular.isDefined(key) || key == null) {
				console.log("FormModelBuilder: addField requires defined key");
				return;
			}

			// add field to last tab
			var field = {'type': 'dropdownList', 
						 'key': key, 
						 'label': label, 
						 'value': value, 
						 'valueType': 'String',
						 'valueList': valueList,
						 'dirty': false, 
						 'valueListProperty': valueListProperty,
						 'readOnly': readOnly,
						 'dirty': false
						 };
			var tab = this.currentTab();
			tab.fields.push(field);
			
			return this;
		},
		
		'getFieldTypeWithKey': function(key, tab) {
			var field = this.getFieldWithKey(key, tab);
			if (field != null) {
				return field.type;
			}
		},
		
		
		/*-- Field level methods ------------------------------------*/
		
		'setFieldDirty': function(field) {
			if (field != null) {
				field.dirty = true;
			}
			return this;
		},
		
		'isFieldDirty': function(field) {
			return angular.isDefined(field) && field != null && angular.isDefined(field.dirty) && field.dirty;
		},
		
		'isNumber': function(fieldValue) {
			return angular.isNumber(fieldValue);
		},

		'isString': function(fieldValue) {
			return angular.isString(fieldValue);
		},

		
		/*-- Form level methods -------------------------------------*/
		
		'setActiveTab': function(tabIdx) {
			if (tabIdx >=0 && tabIdx < this.tabs.length) {
				this.activeTab = this.tabs[tabIdx];
			}
			return this;
		},
		
		'isActiveTab': function(tabIdx) {
			if (tabIdx >=0 && tabIdx < this.tabs.length) {
				return this.activeTab == this.tabs[tabIdx];
			}
			else
				return false;
		},
				
		'isFormDirty': function() {
			for (tabIdx in this.tabs) {
				var tab = this.tabs[tabIdx];
				for (fIdx in tab.fields) {
					var field = tab.fields[fIdx];
					if (field.dirty)
						return true;
				}
			}
			return false;
		},
		
		'setFormClean': function() {
			for (tabIdx in this.tabs) {
				var tab = this.tabs[tabIdx];
				for (fIdx in tab.fields) {
					var field = tab.fields[fIdx];
					field.dirty = false;;
				}
			}
		}
	}
};
	
rmForms.directive('rmForm', function() {
	var directive = {};

	directive.restrict = 'E';	// restrict directive to elements
	directive.templateUrl = "/com.voxatec.argame.web.admin/webapp/shared/directives/formTemplate.html";
	
	directive.scope = {
		formModel: "=formModel"
	}
		
	return directive;
})
   