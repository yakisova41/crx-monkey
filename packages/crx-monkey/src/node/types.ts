import { BuildOptions } from 'esbuild';
import { Options } from 'prettier';

export interface CrxMonkeyConfig {
  manifestPath: string;
  chromeOutputDir: string;
  userscriptOutput: string;
  esBuildOptions: BuildOptions;
  devServer: {
    port: number;
    host: string;
    websocket: number;
    disableWsUserscript?: boolean;
  };
  publicDir: string;
  userScriptHeader: UserScriptHeader;
  importIconToUserscript: boolean;

  // This propetery of typo had used until version 0.7.0
  importIconToUsercript: boolean;

  prettier: CrxPrettierOptions;
}

export interface CrxPrettierOptions {
  format: boolean;
  options: Options;
}

export type NonLoadedCrxMonkeyConfig = {
  [key in keyof CrxMonkeyConfig]?: CrxMonkeyConfig[key];
};

export type UserScriptHeader = Array<[keyof UserScriptHeaderProps, string]>;

export interface UserScriptHeaderProps {
  '@name': string;
  '@namespace'?: string;
  '@copyright'?: string;
  '@version': string;
  '@description'?: string;
  '@icon'?: string;
  '@iconURL'?: string;
  '@defaulticon'?: string;
  '@icon64'?: string;
  '@icon64URL'?: string;
  '@grant'?: string;
  '@author'?: string;
  '@homepage'?: string;
  '@homepageURL'?: string;
  '@website'?: string;
  '@source'?: string;
  '@antifeature'?: string;
  '@require'?: string;
  '@resource'?: string;
  '@include'?: string;
  '@match'?: string;
  '@exclude'?: string;
  '@run-at'?: string;
  '@sandbox'?: string;
  '@connect'?: string;
  '@noframes'?: string;
  '@updateURL'?: string;
  '@downloadURL'?: string;
  '@supportURL'?: string;
  '@webRequest'?: string;
  '@unwrap'?: string;
  [key: string]: string | undefined;
}

export interface CrxMonkeyManifest extends chrome.runtime.ManifestV3 {
  content_scripts?: CrxMonkeyContentScripts;
}

export type CrxMonkeyContentScripts = Array<{
  matches?: string[] | undefined;
  exclude_matches?: string[] | undefined;
  css?: string[] | undefined;
  js?: string[] | undefined;
  run_at?: 'document_start' | 'document_end' | 'document_idle' | undefined;
  all_frames?: boolean | undefined;
  match_about_blank?: boolean | undefined;
  include_globs?: string[] | undefined;
  exclude_globs?: string[] | undefined;
  world?: 'ISOLATED' | 'MAIN' | undefined;
  userscript_direct_inject?: boolean;
  connection_isolated?: boolean;
  bind_GM_api?: boolean;
  [key: string]: unknown;
}>;
