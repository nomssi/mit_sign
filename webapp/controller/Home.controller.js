sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"sap/ui/model/Sorter",
	"sap/ui/model/FilterOperator"
], function (
	BaseController,
	JSONModel,
	formatter,
	Fragment,
	Filter,
	Sorter,
	FilterOperator) {
	"use strict";

	return BaseController.extend("Signature.controller.Home", {
		formatter: formatter,

		onExit: function () {
			this._disableAutoReload();
		},

		_enableAutoReload: function () {
			if (!this._intervalID) {
				// Create Trigger and register handler
				this._intervalID = setInterval(function () {
					this._reloadData();
				}.bind(this), 20000);
			}
		},

		_disableAutoReload: function () {
			if (this._intervalID) {
				clearInterval(this._intervalID); // stop the interval on exit; 
				this._intervalID = 0;
			};
		},

		onInit: function () {
			var oComponent = this.getOwnerComponent();
			this._router = oComponent.getRouter();
			// this._router.getRoute("").attachMatched(this._onRouteMatched, this);			

			this._enableAutoReload();
			this._initViewPropertiesModel();
			this.initMessageManager(this);
		},

		// _onRouteMatched: function (oEvent) {
		// 	this._oMessageManager.removeAllMessages(); // reset potential server-side messages
		// },
		
		_reloadData: function () {
			var oEventsList = this.byId("eventsList");
			oEventsList.getBinding("items").refresh(true);
			var date = new Date();
			this._oViewProperties.setProperty("/updateTime", date.toLocaleTimeString("de-DE"));
		},

		_initViewPropertiesModel: function () {
			var date = new Date();
			this._oViewProperties = new JSONModel({
				updateTime: date.toLocaleTimeString("de-DE"),
				listTableTitle: this.getResourceBundle().getText("ReceiverName"),
				UserName: "Nutzer..."
			});
			this.setModel(this._oViewProperties, "viewProperties");

		//	this._oViewProperties.setProperty("/UserName", this._getUserName());
		},

		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function (oEvent) {
			// update the list's object counter after the table update
			var sTitle,
				oList = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and the list is not empty
			if (iTotalItems && oList.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("ListTitleCount", [iTotalItems]);
			} else {
				sTitle = this.getResourceBundle().getText("ListTitle");
			}
			this.getModel("viewProperties").setProperty("/listTableTitle", sTitle);
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
			var oListBinding = this.getView().byId("eventsList").getBinding("items");
			oListBinding.filter(aFilter);
		},

		onGroupByEvent: function () {
			// sort first, als only adjacent rows can be grouped
			var oListBinding = this.byId("eventsList").getBinding("items");
			var oSorter = new Sorter("ReceiverPartner", false, true);
			oListBinding.sort(oSorter);
		},

		/**
		 * Event handler for the filter, sort and group buttons to open the ViewSettingsDialog.
		 * @param {sap.ui.base.Event} oEvent the button press event
		 * @public
		 */
		onOpenViewSettings: function (oEvent) {
			var sDialogTab = "filter";
			if (oEvent.getSource() instanceof sap.m.Button) {
				var sButtonId = oEvent.getSource().getId();
				if (sButtonId.match("sort")) {
					sDialogTab = "sort";
				} else if (sButtonId.match("group")) {
					sDialogTab = "group";
				}
			}
			// load asynchronous XML fragment
			if (this.byId("viewSettingsDialog")) {
				this.byId("viewSettingsDialog").open(sDialogTab);
			} else {
				Fragment.load({
					id: this.getView().getId(),
					name: "Signature.view.ViewSettingsDialog",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open(sDialogTab);
				}.bind(this));
			}
		},

		/**
		 * Event handler called when ViewSettingsDialog has been confirmed, i.e.
		 * has been closed with 'OK'. In the case, the currently chosen filters, sorters or groupers
		 * are applied to the master list, which can also mean that they
		 * are removed from the master list, in case they are
		 * removed in the ViewSettingsDialog.
		 * @param {sap.ui.base.Event} oEvent the confirm event
		 * @public
		 */
		onConfirmViewSettingsDialog: function (oEvent) {

			this._applySortGroup(oEvent);
		},

		/**
		 * Apply the chosen sorter and grouper to the master list
		 * @param {sap.ui.base.Event} oEvent the confirm event
		 * @private
		 */
		_applySortGroup: function (oEvent) {
			var aSorters = [],
				mParams = oEvent.getParameters(),
				oListBinding = this.getView().byId("eventsList").getBinding("items");

			var sPath = mParams.sortItem.getKey();
			var bDescending = mParams.sortDescending;
			aSorters.push(new Sorter(sPath, bDescending));
			oListBinding.sort(aSorters);
		},

		onSortVBELN: function () {
			// reuse the current sorter
			var oListBinding = this.getView().byId("eventsList").getBinding("items");
			var aListSorters = oListBinding.aSorters;
			var aSorter;
			if (aListSorters.length > 0) {
				aSorter = aListSorters[0];
				aSorter.bDescending = !aSorter.bDescending;
				oListBinding.sort(aSorter);
			}
		},

		onReset: function () {
			var oListBinding = this.getView().byId("eventsList").getBinding("items");
			oListBinding.sort([]);
		},

		toggleAutoUpdate: function (oEvent) {
			if (oEvent.getSource().getPressed()) {
				this._enableAutoReload();
			} else {
				this._disableAutoReload();
			}
		}
	});
});