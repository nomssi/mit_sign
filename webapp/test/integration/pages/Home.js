sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/actions/Press",
	"sap/ui/test/actions/EnterText"
], function (Opa5, Press, EnterText) {
	"use strict";

	Opa5.createPageObjects({
		onMyPageUnderTest: {
			actions: {
				iPressPage_homePage: function () {
					return this.waitFor({
						id: "homePage",
						viewName: "Home",
						actions: new Press(),
						errorMessage: "Was not able to find the control with the id homePage"
					});
				},
				iPressList_eventsList: function () {
					return this.waitFor({
						id: "eventsList",
						viewName: "Home",
						actions: new Press(),
						errorMessage: "Was not able to find the control with the id eventsList"
					});
				},
				iPressSearchField_searchField: function () {
					return this.waitFor({
						id: "searchField",
						viewName: "Home",
						actions: new Press(),
						errorMessage: "Was not able to find the control with the id searchField"
					});
				},
				iEnterTextSearchField_searchField: function () {
					return this.waitFor({
						id: "searchField",
						viewName: "Home",
						actions: new EnterText({
							text: "Text to enter in the control"
						}),
						errorMessage: "Was not able to find the control with the id searchField"
					});
				},
				iPressButton_showPopoverButton: function () {
					return this.waitFor({
						id: "showPopoverButton",
						viewName: "Home",
						actions: new Press(),
						errorMessage: "Was not able to find the control with the id showPopoverButton"
					});
				}
			},
			assertions: {
				iDoMyAssertion: function () {
					return this.waitFor({
						id: "ControlId",
						viewName: "Home",
						success: function () {
							Opa5.assert.ok(false, "Implement me");
						},
						errorMessage: "Was not able to find the control with the id ControlId"
					});
				}
			}
		}
	});
});