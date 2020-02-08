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

	return BaseController.extend("Signature.controller.Home", {
		formatter : formatter,

		onInit: function () {
			var oComponent = this.getOwnerComponent();
			this._router = oComponent.getRouter();
			this._router.getRoute("sign").attachMatched(this._onRouteMatched, this);

			var that = this;
			setInterval( function() { that._reloadData(); }, 10000 );
			
			this._initViewPropertiesModel();
		},

		_initViewPropertiesModel: function() {
			var date = new Date();
			this._oViewProperties = new JSONModel({
				updateTime: date.toLocaleTimeString("de-DE")
			});
			this.getView().setModel(this._oViewProperties, "viewProperties");
		},

		_onRouteMatched: function() {
			var bSmallScreen = this.getModel("appView").getProperty("/smallScreenMode");
			if (bSmallScreen) {
				this._setLayout("One");
			}
			
			
		},

		_reloadData :function(){
			var oView = this.getView(),
			oModel = oView.getModel(),
			oList = this.byId("eventsList");
			oList.getBinding("items").refresh(true);
			var date = new Date();
			this._oViewProperties.setProperty("/updateTime", date.toLocaleTimeString("de-DE"));
		},
		
		onSearch: function () {
			this._search();
		},

		onRefresh: function () {
			// trigger search again and hide pullToRefresh when data ready
			var oProductList = this.byId("productList");
			var oBinding = oProductList.getBinding("items");
			var fnHandler = function () {
				this.byId("pullToRefresh").hide();
				oBinding.detachDataReceived(fnHandler);
			}.bind(this);
			oBinding.attachDataReceived(fnHandler);
			this._search();
		},

		_search: function () {
			var oView = this.getView();
			var oProductList = oView.byId("productList");
			var oCategoryList = oView.byId("categoryList");
			var oSearchField = oView.byId("searchField");

			// switch visibility of lists
			var bShowSearchResults = oSearchField.getValue().length !== 0;
			oProductList.setVisible(bShowSearchResults);
			oCategoryList.setVisible(!bShowSearchResults);

			// filter product list
			var oBinding = oProductList.getBinding("items");
			if (oBinding) {
				if (bShowSearchResults) {
					var oFilter = new Filter("Name", FilterOperator.Contains, oSearchField.getValue());
					oBinding.filter([oFilter]);
				} else {
					oBinding.filter([]);
				}
			}
		},

		onUpdateFinished: function(oEvent){

		},
		
		onEventListItemPress: function (oEvent) {
			var oBindContext = oEvent.getSource().getBindingContext();
			var oModel = oBindContext.getModel();
			var sId = oModel.getData(oBindContext.getPath()).VBELN.trim();
			this._router.navTo("sign", {id: sId});
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