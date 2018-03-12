define(function(require, exports) {
	'use strict';

	// *****************************************************************************
	// Custom Modules

	// App
	const { AppConfig } = require('../config');
	const { SessionHistory } = require('./session-history');

	// Utils
	const { WindowEvents, GlobalEvents } = require('../utils/global-events');
	const { HTMLCreator } = require('../utils/dom');
	const DOMComponent = require('../utils/components');

	// *****************************************************************************
	// Custom Modules

	/*
	* Config panel
	*/

	function ConfigPanel(document)
	{
		// Create DomHealper
		var DomElem = HTMLCreator(document);

		// ------------------------------------------------------------------------
		// Create UI

		var panel = DomElem('div', {class: 'config-panel'});

		// Close button
		var closeBtn = DomElem('div', {class: 'css-close-button'});
		panel.appendChild(closeBtn);
		// ------------------------------------------------------------------------
		// Methods

		function RangeOptionConfig(options)
		{
			var optionRG = new DOMComponent.RangeControl(document, {
				value: AppConfig.get(options.key),
				description: options.name,
				step: options.step ? options.step : 1,
				minValue: options.minValue ? options.minValue : 1,
				maxValue: options.maxValue ? options.maxValue : 1,
				onChange: function(value) {
					AppConfig.set(options.key, value);
					if (options.callback) {
						options.callback(value);
					}
				},
			});
			options.parent.addItem(optionRG.DOMRoot);
			GlobalEvents.on(options.key, function(value) {
				optionRG.setValue(value, false);
			});
		}

		function ToggleOptionConfig(options)
		{
			var toggleBtn = new DOMComponent.ToggleButton(document, {
				state: AppConfig.get(options.key),
				description: options.name,
				onState: options.onState,
				offState: options.offState,
				callback: function(value) {
					AppConfig.set(options.key, value);
					if (options.callback) {
						options.callback(value);
					}
				},
			});
			options.parent.addItem(toggleBtn.DOMRoot);
			GlobalEvents.on(options.key, function(value) {
				toggleBtn.setValue(value, false);
			});
		}

		function ConfigSection(document, options)
		{
			var sectionContainer = DomElem('div', {class: 'section-container'});
			var sectionTitle = DomElem('div', {class: 'section-title'});
			var title = DomElem('div', {class: 'title'});
			var dropIcon = DomElem('div', {class: 'drop-icon'});
			var sectionBody = DomElem('div', {class: 'section-body'});

			if (options.id) {
				sectionContainer.setAttribute('id', options.id);
			}

			title.textContent = options.title;
			sectionTitle.appendChild(dropIcon);
			sectionTitle.appendChild(title);

			sectionContainer.appendChild(sectionTitle);
			sectionContainer.appendChild(sectionBody);

			sectionTitle.addEventListener('click', function() {

				// manual mode
				var isCollapsed = sectionContainer.hasAttribute('collapsed');
				if (isCollapsed) {
					sectionContainer.removeAttribute('collapsed');
				} else {
					sectionBody.style.height = sectionBody.clientHeight + 'px';
					sectionContainer.setAttribute('collapsed', '');
				}
			});

			this.container = sectionContainer;
			this.addItem = function(item) {
				sectionBody.appendChild(item);
			};
		}

		// ------------------------
		// Section: UI scaling

		(function() {

			var section = new ConfigSection(document, { title: 'UI Scaling' });
			panel.appendChild(section.container);

			RangeOptionConfig({ parent: section, name: 'Panel width (px)', key: 'style.panel.width', minValue: 500, maxValue: 800, step: 5});
			RangeOptionConfig({ parent: section, name: 'Panel height (px)', key: 'style.panel.height', minValue: 400, maxValue: 600, step: 5});
			RangeOptionConfig({ parent: section, name: 'Header bar', key: 'style.scale.header', minValue: 10, maxValue: 50});
			RangeOptionConfig({ parent: section, name: 'Toolbar', key: 'style.scale.toolbar', minValue: 10, maxValue: 50});
			RangeOptionConfig({ parent: section, name: 'Session list', key: 'style.scale.sessions', minValue: 10, maxValue: 50});
			RangeOptionConfig({ parent: section, name: 'Bookmarks list', key: 'style.scale.bookmarks', minValue: 10, maxValue: 50});

		})();

		// ------------------------
		// Section: General settings

		(function() {

			var section = new ConfigSection(document, { title: 'General' });
			panel.appendChild(section.container);

			ToggleOptionConfig({
				parent: section,
				name: 'Open url (on click)',
				key: 'bookmark.click.new.tab',
				onState: 'New tab',
				offState: 'Same tab',
			});

			ToggleOptionConfig({
				parent: section,
				name: 'Context menu icons',
				key: 'context.menu.icons',
				onState: 'Show',
				offState: 'Disabled',
			});
		})();

		// ------------------------
		// Section: History settings

		(function() {

			var section = new ConfigSection(document, { title: 'Auto-save History', id: 'history-config' });
			panel.appendChild(section.container);

			SessionHistory.getConfig(function (historyConfig) {

				// Context menu icons
				var contextMenuIconsTB = new DOMComponent.ToggleButton(document, {
					state: historyConfig.enabled,
					description: 'Auto-save sessions',
					onState: 'Enabled',
					offState: 'Disabled',
					callback: function(value) {
						historyConfig.enabled = value;
						SessionHistory.updateConfig(historyConfig);
						if (value == false) {
							WindowEvents.emit(document, 'ShowSyncList', { update: true });
						}
						WindowEvents.emit(document, 'SetUIState', {'history': value});
					}
				});
				section.addItem(contextMenuIconsTB.DOMRoot);
				WindowEvents.emit(document, 'SetUIState', {'history': historyConfig.enabled});

				// Auto-save interval
				var saveIntervalRG = new DOMComponent.RangeControl(document, {
					value: historyConfig.interval,
					description: 'Save interval (seconds)',
					minValue: 10,
					onChange: function(value) {
						historyConfig.interval = value;
						SessionHistory.updateConfig(historyConfig);
					},
				});
				section.addItem(saveIntervalRG.DOMRoot);

				// Auto-save slots
				var saveSlotsRG = new DOMComponent.RangeControl(document, {
					value: historyConfig.savingSlots,
					description: 'Saving slots',
					minValue: 2,
					onChange: function(value) {
						historyConfig.savingSlots = value;
						SessionHistory.updateConfig(historyConfig);
					},
				});
				section.addItem(saveSlotsRG.DOMRoot);

				// Auto-save expire time
				var expireAfterRG = new DOMComponent.RangeControl(document, {
					value: historyConfig.expireTimeHours,
					description: 'Delete after [...] hours',
					minValue: 0,
					onChange: function(value) {
						historyConfig.expireTimeHours = value;
						SessionHistory.updateConfig(historyConfig);
					},
				});
				section.addItem(expireAfterRG.DOMRoot);
			});
		})();

		// ------------------------------------------------------------------------
		// Events

		closeBtn.addEventListener('click', function() {
			WindowEvents.emit(document, 'SetUIState', { config : undefined});
		});

		// ------------------------------------------------------------------------
		// Public properties

		this.document = document;
		this.DOMRoot = panel;
	}

	// *****************************************************************************
	// Public API

	exports.ConfigPanel = ConfigPanel;
});