import { UserScriptHeader, UserScriptHeaderProps } from '../types';

export class UserscriptHeaderFactory {
  private detail: UserScriptHeader = [];

  /**
   * Push header item.
   * @param key
   * @param value
   */
  public push(key: keyof UserScriptHeaderProps, value: string) {
    this.detail.push([key, value]);
  }

  /**
   * Output created header.
   * @returns Userscript header string.
   */
  public create() {
    const header: string[] = [];

    header.push('// ==UserScript==');

    this.detail.forEach(([key, value]) => {
      header.push(`// ${key} ${value}`);
    });

    header.push('// ==/UserScript==');

    return header.join('\n');
  }

  /**
   * Replace header item.
   * @param key
   * @param value
   */
  public replace(key: keyof UserScriptHeaderProps, value: string) {
    this.detail.forEach(([detailKey], index) => {
      if (key === detailKey) {
        this.detail[index] = [key, value];
      }
    });
  }

  /**
   * Is exist the key in created header??
   * @param key
   * @returns
   */
  public exist(key: keyof UserScriptHeaderProps) {
    this.detail.forEach(([detailKey]) => {
      if (key === detailKey) {
        return true;
      }
    });
    return false;
  }
}
