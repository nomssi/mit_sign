sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/Device"
], function (
	BaseController,
	JSONModel,
	formatter,
	Filter,
	FilterOperator,
	Device) {
	"use strict";

	return BaseController.extend("mit_sign.controller.Home", {
		formatter : formatter,

		onInit: function () {
			var oComponent = this.getOwnerComponent();
			this._router = oComponent.getRouter();
			this._router.getRoute("sign").attachMatched(this._onRouteMatched, this);

			var that = this;
			setInterval( function() { that._reloadData(); }, 10000 );
			
			this._initViewPropertiesModel();
		},

		_onRouteMatched: function() {
			var bSmallScreen = this.getModel("appView").getProperty("/smallScreenMode");
			if (bSmallScreen) {
				this._setLayout("One");
			}
		},
			
		_reloadData :function(){
			var oEventsList = this.byId("eventsList");
			oEventsList.getBinding("items").refresh(true);
			var date = new Date();
			this._oViewProperties.setProperty("/updateTime", date.toLocaleTimeString("de-DE"));
		},
		
		_initViewPropertiesModel: function() {
			var date = new Date();
			this._oViewProperties = new JSONModel({
				updateTime: date.toLocaleTimeString("de-DE")
			});
			this.getView().setModel(this._oViewProperties, "viewProperties");
		},
		
		onRefresh: function () {
			// trigger search again and hide pullToRefresh when data ready
			var oEventsList = this.byId("eventsList");
			var oBinding = oEventsList.getBinding("items");
			
			var fnHandler = function () {
				this.byId("pullToRefresh").hide();
				oBinding.detachDataReceived(fnHandler);
			}.bind(this);
			oBinding.attachDataReceived(fnHandler);
			this._reloadData();	
		},

		onEventListItemPress: function (oEvent) {
			var oSelectedItem = oEvent.getSource();
			var oBindContext = oSelectedItem.getBindingContext();
			var sPath = oBindContext.getPath();
			
			var oModel = oBindContext.getModel();
			var sId = oModel.getData(sPath).VBELN.trim();
			this._router.navTo("sign", {id: sId});
//			sPath = sPath.substr(1);
//			this._router.navTo("sign", {path: sPath});
		},

        onFilterEvents: function(oEvent) {
        	var aTabFilters = [];                // reset current filters
        	var sQuery = oEvent.getParameter("query");
        	if (sQuery) {
        		aTabFilters.push(new Filter("ReceiverName", FilterOperator.Contains, sQuery));
        	}
		    this._applyListFilters(aTabFilters);
        },
        
		_applyListFilters: function(aFilter) {
        	// filter the list via binding
        	var oList = this.getView().byId("eventsList");

        	var oBinding = oList.getBinding("items");
        	oBinding.filter(aFilter);
		},
        
        onSortVBELN: function() {
        	// reuse the current sorter
        	var oListBinding = this.getView().byId("eventsList").getBinding("items");
        	var aListSorters = oListBinding.aSorters;
        	var oSorter;
        	if (aListSorters.length > 0) {
        		oSorter = aListSorters[0];
        		oSorter.bDescending = !oSorter.bDescending;
        		oListBinding.sort(oSorter);
        	}
        },
		/**
		 * Always navigates back to home
		 * @override
		 */
		onBack: function () {
			this.getRouter().navTo("home");
		}
	});
});