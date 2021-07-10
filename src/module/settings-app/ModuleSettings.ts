/*
 * Copyright 2021 Andrew Cuccinello
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { MODULE_NAME } from '../../../../src/module/Constants';
import SettingsApp from './SettingsApp';

// TODO: Localization of strings in this file.

const MENU_KEY = 'SETTINGS_MENU';

export type IFeatureInputType = 'checkbox' | 'number' | 'text' | 'file';
export interface IFeatureAttribute {
    icon: string;
    title: string;
}
export interface IFeatureInput {
    name: string;
    label: string;
    type: IFeatureInputType;
    help?: string;
    value: any;
    max?: number;
    min?: number;
}
export interface IFeatureRegistration {
    name: string;
    type: BooleanConstructor | NumberConstructor | StringConstructor;
    default: any;
    onChange?: (value: any) => void;
}
export type HookCallback = () => void;
export interface IFeatureDefinition {
    id: string;
    title: string;
    attributes?: IFeatureAttribute[];
    description: string;
    default?: boolean;
    inputs: IFeatureInput[];
    register: IFeatureRegistration[];
    help?: string;
    onReady?: HookCallback;
    onInit?: HookCallback;
    onSetup?: HookCallback;
}

export const ATTR_RELOAD_REQUIRED: IFeatureAttribute = {
    icon: 'fas fa-sync',
    title: 'Reload Required',
};
export const ATTR_REOPEN_SHEET_REQUIRED: IFeatureAttribute = {
    icon: 'fas fa-sticky-note',
    title: 'Sheets must be closed and re-opened.',
};

// TODO: This can be a generic class so we have correctly typed features.
export default class ModuleSettings {
    protected static _instance: ModuleSettings;
    public static get instance() {
        if (this._instance === undefined) {
            this._instance = new ModuleSettings();
        }
        return this._instance;
    }

    protected _moduleName: string;
    protected _features: IFeatureDefinition[];

    public get features(): IFeatureDefinition[] {
        return duplicate(this._features) as IFeatureDefinition[];
    }

    /**
     * Retrieve a setting from the store.
     * @param key They key the setting resides at.
     */
    public get<T = any>(key: string): T {
        return game.settings.get(this._moduleName, key) as T;
    }

    /**
     * Set the value of a setting in the store.
     * @param key The key the setting resides at.
     * @param value The value the setting should be set to.
     */
    public async set(key: string, value: any) {
        return game.settings.set(this._moduleName, key, value);
    }

    /**
     * Register a setting with the store.
     * @param key The key the setting should reside at.
     * @param value The default value of the setting.
     */
    public reg(key: string, value: any) {
        game.settings.register(this._moduleName, key, value);
    }

    /**
     * Binds on init hooks for each feature that has them.
     */
    public onInit() {
        for (const feature of this._features) {
            if (feature.onInit && this.get(feature.id)) {
                feature.onInit();
            }
        }
    }

    /**
     * Binds on setup hooks for each feature that has them.
     */
    public onSetup() {
        for (const feature of this._features) {
            if (feature.onSetup && this.get(feature.id)) {
                feature.onSetup();
            }
        }
    }

    /**
     * Binds on ready hooks for each feature that has them.
     */
    public onReady() {
        for (const feature of this._features) {
            if (feature.onReady && this.get(feature.id)) {
                feature.onReady();
            }
        }
    }

    /**
     * Registers all game settings for the application.
     */
    public registerAllSettings(moduleName: string, features: IFeatureDefinition[]) {
        this._moduleName = moduleName;
        this._features = features;

        for (const feature of features) {
            // Register the feature toggle
            const enabled = {
                name: feature.id,
                scope: 'world',
                type: Boolean,
                default: feature.default ?? false,
                config: false,
                restricted: true,
            };
            this.reg(feature.id, enabled);

            // Register any other settings values for a feature.
            for (const registration of feature.register) {
                const setting = {
                    name: registration.name,
                    scope: 'world',
                    type: registration.type,
                    default: registration.default,
                    config: false,
                    restricted: true,
                    onChange: registration.onChange,
                };
                this.reg(registration.name, setting);
            }
        }

        game.settings.registerMenu(MODULE_NAME, MENU_KEY, {
            name: 'Settings',
            label: 'Settings',
            hint: 'Configure enabled features and other options, view the license, and see the about section to learn more about my modules.',
            icon: 'fas fa-cogs',
            type: SettingsApp,
            restricted: true,
        });
    }
}
