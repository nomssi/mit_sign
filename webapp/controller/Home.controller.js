sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (
	BaseController,
	JSONModel,
	formatter,
	Filter,
	FilterOperator) {
	"use strict";

	return BaseController.extend("Signature.controller.Home", {
		formatter: formatter,

		onExit: function () {
			if (this._intervalID) {
				clearInterval(this._intervalID);	// stop the interval on exit; 
			};
		},

		onInit: function () {
			var oComponent = this.getOwnerComponent();
			this._router = oComponent.getRouter();
			// this._router.getRoute("sign").attachMatched(this._onRouteMatched, this);

			// Create Trigger and register handler
			this._intervalID = setInterval(function () {
				this._reloadData();
			}.bind(this), 20000);

			this._initViewPropertiesModel();
		},

		_reloadData: function () {
			var oEventsList = this.byId("eventsList");
			oEventsList.getBinding("items").refresh(true);
			var date = new Date();
			this._oViewProperties.setProperty("/updateTime", date.toLocaleTimeString("de-DE"));
		},

		_initViewPropertiesModel: function () {
			var date = new Date();
			this._oViewProperties = new JSONModel({
				updateTime: date.toLocaleTimeString("de-DE")
			});
			this.setModel(this._oViewProperties, "viewProperties");
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
			this._router.navTo("sign", {
				id: sId
			});
		},

		onFilterEvents: function (oEvent) {
			var aTabFilters = []; // reset current filters
			var sQuery = oEvent.getParameter("query");
			if (sQuery) {
				aTabFilters.push(new Filter("ReceiverPartner", FilterOperator.Contains, sQuery));
			}
			this._applyListFilters(aTabFilters);
		},

		_applyListFilters: function (aFilter) {
			// filter the list via binding
			var oList = this.getView().byId("eventsList");

			var oBinding = oList.getBinding("items");
			oBinding.filter(aFilter);
		},

		onSortVBELN: function () {
			// reuse the current sorter
			var oListBinding = this.getView().byId("eventsList").getBinding("items");
			var aListSorters = oListBinding.aSorters;
			var oSorter;
			if (aListSorters.length > 0) {
				oSorter = aListSorters[0];
				oSorter.bDescending = !oSorter.bDescending;
				oListBinding.sort(oSorter);
			}
		}
	});
});