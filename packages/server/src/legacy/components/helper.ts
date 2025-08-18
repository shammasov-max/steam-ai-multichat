import {
  isProduction,
  domain,
  msInSecond
} from "./utils/common";
import {
  getServerRequestForm,
  encryptServerRequestForm
} from "./utils/utils";
import request from "request";
import SteamTotp from "steam-totp";
import Profile from "../Profile";
import fs from 'fs';
import {
  shell,
  ipcRenderer
} from "electron";
import os from 'os';
import {
  readMaFiles
} from "./utils/maFile";
const recycle_timeout = 15000;
const avatar_change_timeout = 35000;
const profile_change_timeout = 8500;
const replacement_variable = "<=%=>";
const key = require("../../recourses/key");
const online_states = require('../../recourses/states');
const address = 'http://95.47.137.72:11882';
import fastq from 'fastq';
import remote from "@electron/remote";
import cheerio from 'cheerio';
import path from "path";
import {
  logger
} from "./logger";
import machine_uuid from "machine-uuid";
let valid_accounts = '';
let invalid_accounts = '';
let mafiles_path = localStorage.getItem('mafiles_path');
process.steamTimeOffset = 0;
process.online_states = online_states;
SteamTotp.getTimeOffset((timeOffsetError, timeOffset) => {
  if (!timeOffsetError) {
    process.steamTimeOffset = timeOffset;
  }
  logger.info("steamTimeOffset: " + process.steamTimeOffset);
});
const read_file = async filePath => {
  let fileContent = null;
  try {
    fileContent = (await process.storage.readFile(filePath)).toString("utf-8");
  } catch (err: unknown) {
    logger.error("read_file " + err);
  }
  return fileContent;
};
const pretty_time = timestamp => {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const formattedTime = (hours < 10 ? '0' + hours : hours) + ':' + (minutes < 10 ? '0' + minutes : minutes) + ':' + (seconds < 10 ? '0' + seconds : seconds);
  return formattedTime;
};
const save_localstorage = async () => {
  localStorage.setItem("hideFriend", document.getElementById("hideFriend").value);
  localStorage.setItem("selected_online_state", document.getElementById('setStateAll').value);
  for (const clientLogin in process.clients) {
    const client = process.clients[clientLogin];
    client.client.logOff();
    const oldFriends = {};
    for (const steamId in client.myFriends) {
      if (client.myFriends[steamId] == 3) {
        oldFriends[steamId] = 1;
      }
    }
    if (Object.keys(oldFriends).length > 0) {
      localStorage.setItem(clientLogin + "_old_friends", JSON.stringify(oldFriends));
    }
  }
  return true;
};
const open_link_browser = (clientLogin, url) => {
  const client = process.clients[clientLogin];
  if (client) {
    ipcRenderer.send("open", client.cookies, url, client.default_proxy, client.userAgent);
  } else {
    ipcRenderer.send('open', "a=b", url, undefined, undefined);
  }
};
const pretty_date = number => '' + (number < 10 ? '0' + number : number);
const get_offline_time = timestamp => {
  const date = new Date(timestamp);
  return '' + (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '/' + ('' + (date.getDate() < 10 ? '0' + date.getDate() : date.getDate())) + ". " + ('' + (date.getHours() < 10 ? '0' + date.getHours() : date.getHours())) + ':' + ('' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()));
};
const open_link = url => shell.openExternal(url);
const random = (max, min = 0) => Math.floor(Math.random() * (max - min)) + min;
const parse_area = text => text.replace(/\n /gm, '').trim().split("\n").filter(line => line.trim() !== '');
const template_timeout = template => {
  try {
    const urlRegex = /(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/i;
    const urlMatch = template.match(urlRegex);
    const textLength = urlMatch ? template.length - urlMatch[0].length : template.length;
    return textLength * process.settings.auto_template_timeout_milisec;
  } catch (err: unknown) {
    const templateLength = template.length;
    return templateLength * process.settings.auto_template_timeout_milisec;
  }
};
const notificate = (title, message, notificationData) => {
  if (process.settings.notification) {
    const notification = new Notification(title, {
      'body': message,
      'icon': "./icon.ico"
    });
    notification.onclick = () => {
      if (notificationData.type === "message") {
        document.getElementById('friends').click();
        process.clients[notificationData.login].create_chat(notificationData.user_id);
        remote.getCurrentWindow().focus();
      } else {
        if (notificationData.type === "remove") {
          shell.openExternal("https://steamcommunity.com/profiles/" + notificationData.user_id);
        } else if (notificationData.type === "comment") {
          open_link_browser(notificationData.login, 'https://steamcommunity.com/profiles/' + notificationData.client_id);
        }
      }
    };
  }
};
const provide_mafile_path = async () => {
  const dialogResult = await remote.dialog.showOpenDialog({
    'properties': ["openDirectory"]
  });
  mafiles_path = dialogResult.filePaths[0];
  localStorage.setItem('mafiles_path', mafiles_path);
  if (mafiles_path !== undefined) {
    try {
      const maFiles = await readMaFiles(mafiles_path);
      process.maFiles = {
        ...maFiles
      };
      const maFilesCount = Object.keys(process.maFiles).length;
      swal("Success", maFilesCount + " " + process.languages[process.settings.language].mafiles_loaded, "success");
    } catch (err: unknown) {
      process.maFiles = {};
      swal("Error", "maFiles not found", "error");
    }
  }
};
const read_mafiles = async () => {
  try {
    const maFiles = await readMaFiles(mafiles_path || "./maFiles");
    process.maFiles = {
      ...maFiles
    };
  } catch (err: unknown) {
    process.maFiles = {};
    process.helper.print_info('' + err, 'red');
  }
};

// Define array types for better type safety
type ConsoleLogEvent = {
  readonly login: string;
  readonly link: string;
} | null;

type ConsoleLogEntry = {
  readonly node: Node;
  readonly event: ConsoleLogEvent;
};

type TemplateMessage = {
  readonly name: string;
  readonly messages: readonly string[];
  readonly color: string | null;
  readonly link: boolean;
};

type DomainTemplate = {
  readonly template_domain?: string;
  readonly [key: string]: string | undefined;
};

type AccountData = {
  readonly login: string;
  readonly no_replace_login: string;
  readonly password: string;
  readonly proxy?: string;
  readonly maFile?: {
    readonly shared_secret: string;
    readonly identity_secret: string;
    readonly inlineMafile: boolean;
  };
};

const print_info = (message: string, color: string, url?: string | false, login?: string | false) => {
  const terminal = document.getElementById("terminal");
  const paragraph = document.createElement('p');
  paragraph.innerHTML = message;
  paragraph.className = color + " " + (url ? 'has_event' : '');
  if (url) {
    paragraph.onclick = () => open_link_browser(login, url);
  }
  if (process.current_modal === 'console') {
    terminal?.insertAdjacentElement("beforeend", paragraph);
    terminal?.scrollTop += 50;
  }
  const consoleLogs: ConsoleLogEntry[] = process.console_logs || [];
  consoleLogs.push({
    'node': paragraph.cloneNode(true),
    'event': url ? {
      'login': login || '',
      'link': url
    } : null
  });
  process.console_logs = consoleLogs;
};

const close_modal = () => {
  const modals = document.querySelectorAll(".modal");
  for (let i = 0; i < modals.length; i++) {
    (modals[i] as HTMLElement).style.display = "none";
  }
};

const swap_active_header_button = () => {
  const headerButtons = document.querySelectorAll(".header_button");
  for (let i = 0; i < headerButtons.length; i++) {
    headerButtons[i].classList.remove("active");
  }
};

const get_templates = (): readonly TemplateMessage[] => {
  const templatesElement = document.getElementById("templates") as HTMLInputElement;
  return templatesElement.value.split(';').filter(template => template !== '').map(template => {
    const colorMatch = template.match(/template_color=(.*)/);
    const linkMatch = template.match(/template_link/);
    let color = null;
    let hasLink = false;
    if (linkMatch) {
      hasLink = true;
      template = template.replace(/template_link/ig, '');
    }
    if (colorMatch) {
      color = colorMatch[1];
      template = template.replace(/template_color=(.*)/ig, '');
    }
    const parts = template.split('|');
    return {
      'name': parts[0].trim().replace(/"|<|>/g, ''),
      'messages': parts.slice(1),
      'color': color,
      'link': hasLink
    };
  });
};

const getDomainTemplates = (): DomainTemplate => {
  const domainElement = document.getElementById('template_domain') as HTMLInputElement;
  const templates: DomainTemplate = {};
  domainElement.value.split(';').forEach(template => {
    const parts = template.split('|');
    if (parts.length === 1) {
      templates.template_domain = parts[0].trim();
    } else {
      const [key, value] = parts;
      templates[key.trim()] = value.trim();
    }
  });
  return templates;
};

const replaceTemplateDomains = (template: string, domains: DomainTemplate): string => {
  const domainRegex = /\S+_domain/g;
  const replacedTemplate = template.replace(domainRegex, domain => {
    if (domains.hasOwnProperty(domain)) {
      return domains[domain] || domain;
    }
    return domain;
  });
  return replacedTemplate;
};

const getAccountsFromLoadArea = (skipExisting: boolean): readonly AccountData[] => {
  const accountsElement = document.getElementById("accountsLoadArea") as HTMLTextAreaElement;
  const accounts: AccountData[] = [];
  if (accountsElement.value !== '') {
    const uniqueAccounts = Array.from(new Set(parse_area(accountsElement.value)));
    uniqueAccounts.forEach(accountLine => {
      const [loginPart, proxyPart] = accountLine.split(" - ");
      const loginParts = loginPart.trim().split(':');
      const cleanLogin = loginParts[0].replace(/[\.#@ ]/g, '');
      const originalLogin = loginParts[0];
      if (process.clients[cleanLogin] && !skipExisting) {
        return;
      }
      if (loginPart.includes(":::")) {
        const maFileParts = loginPart.split(":::");
        const [password, sharedSecret, identitySecret] = [maFileParts[0].split(':')[1], maFileParts[1], maFileParts[2]];
        accounts.push({
          'login': cleanLogin,
          'no_replace_login': originalLogin,
          'password': password,
          'proxy': proxyPart,
          'maFile': {
            'shared_secret': sharedSecret,
            'identity_secret': identitySecret,
            'inlineMafile': true
          }
        });
      } else {
        accounts.push({
          'login': cleanLogin,
          'no_replace_login': originalLogin,
          'password': loginParts[1],
          'proxy': proxyPart
        });
      }
    });
  }
  return accounts;
};

const load_data = (_0x3e7f44, _0x430478, _0x5e5c82 = true) => {
  const _0x4d77e8 = document.getElementById(_0x3e7f44).value;
  if (_0x4d77e8 !== '') {
    let _0x37d54b = [];
    if (_0x430478 === "accounts") {
      _0x37d54b = getAccountsFromLoadArea(false);
    } else if (_0x430478 === 'proxy') {
      _0x37d54b = parse_area(_0x4d77e8);
    }
    if (_0x5e5c82) {
      swal('Success', _0x37d54b.length + " " + _0x430478 + " imported !", 'success');
    }
    localStorage.setItem(_0x430478, _0x4d77e8);
    return _0x37d54b;
  } else {
    swal("Error", "Enter " + _0x430478, "error");
    return [];
  }
};
const save_settings = () => {
  const _0x5a450d = document.getElementById("templates").value.trim();
  const _0x420a0e = document.getElementById("new_friend_spam_message").value.trim();
  const _0x81e431 = document.getElementById("auto_message_timeout").value.trim();
  const _0x2381ae = document.getElementById("sound").checked;
  const _0x113d97 = document.getElementById('notification').checked;
  const _0x5dd0b0 = document.getElementById('save_deleted_friends').checked;
  const _0x45caf6 = document.getElementById("auto_message_for_new_friend").checked;
  const _0x3d149c = document.getElementById("auto_template_timeout").checked;
  const _0x42016b = document.getElementById("auto_boost").checked;
  const _0x501072 = document.getElementById('modal_background_color').value;
  const _0x4779c3 = document.getElementById('chat_background_color').value;
  const _0x5e9538 = document.getElementById('account_name_color').value;
  const _0x326e7b = document.getElementById("open_chat_color").value;
  const _0x37565c = document.getElementById("deleted_friend_background").value;
  const _0x1e1cf4 = document.getElementById("auto_template_timeout_milisec").value;
  const _0x38afaf = document.getElementById('paste_template').checked;
  const _0x314966 = document.getElementById('auto_pin_unread_messages').checked;
  const _0x4883ff = document.getElementById("auto_install_update").checked;
  const _0x423593 = document.querySelectorAll(".game_price_checkbox:checked");
  const _0x22dcfd = document.getElementById("not_send_auto_message_for_new_friend_if_has_messages").checked;
  const _0xac1d08 = document.getElementById("pin_top_on_new_message").checked;
  const _0x280431 = document.getElementById("template_domain").value.trim();
  const _0x3d50c4 = document.getElementById("get_user_info").checked;
  const _0x8a748f = document.getElementById("volume").value;
  const _0x5a6ed1 = document.getElementById('dearest_item_language').value;
  const _0x432bb6 = document.getElementById("pin_direction").value;
  process.player.volume = Number(_0x8a748f);
  const _0x46b6b2 = ("\n    " + (_0x501072 ? ".modal { background-color: " + _0x501072 + " !important; }" : '') + "\n    " + (_0x4779c3 ? ".chat { background-color: " + _0x4779c3 + " !important; }" : '') + "\n    " + (_0x5e9538 ? ".my_account { color: " + _0x5e9538 + " !important; }" : '') + "\n    " + (_0x326e7b ? ".open_chat { box-shadow: 0 0 30px " + _0x326e7b + " !important; }" : '') + "\n    " + (_0x37565c ? ".row_user.deleted_friend { background: " + _0x37565c + " !important; }" : '') + "\n  ").trim();
  const _0x3867bd = {};
  const _0xe4f8b1 = document.querySelector(".user_actions_list").children;
  for (let _0x2af07e = 0; _0x2af07e < _0xe4f8b1.length; _0x2af07e++) {
    if (_0xe4f8b1[_0x2af07e].id.search(/unmute_user|remove_deleted_friend_action|unblock|add_deleted_friend_action/i) === -0x1) {
      if (!document.getElementById(_0xe4f8b1[_0x2af07e].id + "_checkbox").checked) {
        _0x3867bd[_0xe4f8b1[_0x2af07e].id] = 0x1;
        document.getElementById(_0xe4f8b1[_0x2af07e].id).classList.add("hide");
      } else {
        document.getElementById(_0xe4f8b1[_0x2af07e].id).classList.remove('hide');
      }
    }
  }
  process.customize_settings = _0x3867bd;
  process.selected_games = [];
  for (let _0x14928a = 0x0; _0x14928a < _0x423593.length; _0x14928a++) {
    process.selected_games.push(Number(_0x423593[_0x14928a].dataset.appid));
  }
  document.getElementById('my_style').innerHTML = _0x46b6b2;
  localStorage.setItem('customize', _0x46b6b2);
  localStorage.setItem("templates", _0x5a450d);
  localStorage.setItem('new_friend_spam_message', _0x420a0e);
  localStorage.setItem('sound', _0x2381ae);
  localStorage.setItem("notification", _0x113d97);
  localStorage.setItem('save_deleted_friends', _0x5dd0b0);
  localStorage.setItem("auto_message_for_new_friend", _0x45caf6);
  localStorage.setItem("auto_message_timeout", _0x81e431);
  localStorage.setItem("auto_template_timeout", _0x3d149c);
  localStorage.setItem("auto_boost", _0x42016b);
  localStorage.setItem("modal_background_color", _0x501072);
  localStorage.setItem("chat_background_color", _0x4779c3);
  localStorage.setItem('account_name_color', _0x5e9538);
  localStorage.setItem('auto_template_timeout_milisec', _0x1e1cf4);
  localStorage.setItem("open_chat_color", _0x326e7b);
  localStorage.setItem("deleted_friend_background", _0x37565c);
  localStorage.setItem('customize_settings', JSON.stringify(process.customize_settings));
  localStorage.setItem("paste_template", _0x38afaf);
  localStorage.setItem('auto_pin_unread_messages', _0x314966);
  localStorage.setItem('auto_install_update', _0x4883ff);
  localStorage.setItem("selected_games", JSON.stringify(process.selected_games));
  localStorage.setItem("template_domain", _0x280431);
  localStorage.setItem("get_user_info", _0x3d50c4);
  localStorage.setItem('volume', _0x8a748f);
  localStorage.setItem("dearest_item_language", _0x5a6ed1);
  localStorage.setItem("pin_direction", _0x432bb6);
  localStorage.setItem("not_send_auto_message_for_new_friend_if_has_messages", _0x22dcfd);
  localStorage.setItem("pin_top_on_new_message", _0xac1d08);
  process.templates = get_templates();
  process.domainTemplates = getDomainTemplates();
  process.settings = {
    ...process.settings,
    'new_friend_spam_message': _0x420a0e,
    'sound': _0x2381ae,
    'notification': _0x113d97,
    'save_deleted_friends': _0x5dd0b0,
    'auto_message_for_new_friend': _0x45caf6,
    'auto_message_timeout': Number(_0x81e431) * 0x3e8,
    'auto_template_timeout': _0x3d149c,
    'auto_template_timeout_milisec': Number(_0x1e1cf4) || 0xc8,
    'paste_template': _0x38afaf,
    'auto_pin_unread_messages': _0x314966,
    'template_domain': _0x280431,
    'get_user_info': _0x3d50c4,
    'auto_boost': _0x42016b,
    'dearest_item_language': _0x5a6ed1,
    'pin_direction': _0x432bb6,
    'not_send_auto_message_for_new_friend_if_has_messages': _0x22dcfd,
    'pin_top_on_new_message': _0xac1d08
  };
  for (const _0x2f2715 in process.clients) {
    process.clients[_0x2f2715].print_deleted_friends();
  }
  swal("Success", process.languages[process.settings.language].settings_saved, 'success');
};
const hideUsersBySelectedOnlineStates = () => {
  for (const _0xad6ea3 in process.hiddenOnlineStates) {
    if (process.hiddenOnlineStates[_0xad6ea3]) {
      toggleUserVisibilityByOnlineState(_0xad6ea3, true);
    }
  }
};
const toggleUserVisibilityByOnlineState = (_0x35dbd9, _0xd703b7) => {
  const _0x2b9cab = document.querySelectorAll(".lastMessages ." + _0x35dbd9);
  const _0x2c8676 = document.querySelectorAll('.' + _0x35dbd9 + '_block');
  if (_0xd703b7) {
    for (let _0x311a14 = 0x0; _0x311a14 < _0x2b9cab.length; _0x311a14++) {
      _0x2b9cab[_0x311a14].remove();
    }
    for (let _0x6245c8 = 0x0; _0x6245c8 < _0x2c8676.length; _0x6245c8++) {
      const _0x4b2cf3 = _0x2c8676[_0x6245c8];
      _0x4b2cf3.innerHTML = '';
      _0x4b2cf3.classList.add("hide");
    }
  } else {
    for (const _0x3092f1 in process.clients) {
      process.clients[_0x3092f1].printFriendsByOnlineState(_0x35dbd9);
    }
  }
};
const hide_offline = () => {
  const _0x28b917 = document.getElementById("hideOffline").checked;
  const _0x4fe9cb = document.querySelectorAll(".lastMessages .Offline");
  const _0x356a7f = document.querySelectorAll(".offline_block");
  if (_0x28b917) {
    for (let _0x166caa = 0x0; _0x166caa < _0x356a7f.length; _0x166caa++) {
      _0x356a7f[_0x166caa].innerHTML = '';
      _0x356a7f[_0x166caa].classList.add("hide");
    }
    for (let _0x59d2c3 = 0x0; _0x59d2c3 < _0x4fe9cb.length; _0x59d2c3++) {
      _0x4fe9cb[_0x59d2c3].remove();
    }
  } else {
    for (const _0xb3e626 in process.clients) {
      process.clients[_0xb3e626].print_offline();
    }
  }
};
const search_by_name = () => {
  try {
    const _0x45deae = RegExp.escape(document.getElementById("searchFriend").value.trim().toLowerCase());
    const _0x15629e = document.querySelectorAll(".lastMessages .row_user");
    for (const _0x462548 in process.clients) {
      process.clients[_0x462548].search_by_name(_0x45deae);
      if (_0x45deae == '') {
        const _0x21ed10 = document.querySelector(".row_body.row_" + _0x462548);
        if (_0x21ed10.dataset.open_by_user == 'false') {
          _0x21ed10.classList.add("hide");
        }
      }
    }
    if (_0x45deae == '') {
      for (let _0x4dada9 = 0x0; _0x4dada9 < _0x15629e.length; _0x4dada9++) {
        _0x15629e[_0x4dada9].classList.remove('hide');
      }
      hideUsersBySelectedOnlineStates();
    } else {
      for (let _0x51a52c = 0x0; _0x51a52c < _0x15629e.length; _0x51a52c++) {
        const _0x1b8603 = _0x15629e[_0x51a52c];
        if (_0x1b8603.dataset.name.search(_0x45deae) !== -0x1 || _0x45deae == '') {
          _0x1b8603.classList.remove("hide");
        } else {
          _0x1b8603.classList.add("hide");
        }
      }
    }
  } catch (err: unknown) {}
};
const hide_by_name = () => {
  const _0x6329ab = RegExp.escape(document.getElementById('hideFriend').value.trim().toLowerCase());
  const _0x430aae = document.querySelectorAll(".row_user");
  for (let _0x5d5488 = 0x0; _0x5d5488 < _0x430aae.length; _0x5d5488++) {
    const _0x3d2dfc = _0x430aae[_0x5d5488];
    if (_0x3d2dfc.dataset.name.search(_0x6329ab) === -0x1 || _0x6329ab == '') {
      _0x3d2dfc.classList.remove('hide');
    } else {
      _0x3d2dfc.classList.add("hide");
    }
    for (const _0x5caee1 in process.hiddenOnlineStates) {
      if (process.hiddenOnlineStates[_0x5caee1] && _0x3d2dfc.classList.contains(_0x5caee1)) {
        _0x3d2dfc.classList.add("hide");
      }
    }
  }
  if (_0x6329ab == '') {
    hideUsersBySelectedOnlineStates();
  }
};
const getAccountString = _0x172795 => {
  const _0x34676a = _0x172795.no_replace_login + ':' + _0x172795.password;
  if (_0x172795.maFile) {
    const {
      shared_secret: _0xb4b50f,
      identity_secret: _0x292f7a
    } = _0x172795.maFile;
    const _0x4435a0 = _0x34676a + ":::" + _0xb4b50f + ":::" + _0x292f7a;
    return _0x172795.proxy ? _0x4435a0 + " - " + _0x172795.proxy : _0x4435a0;
  }
  return _0x172795.proxy ? _0x34676a + " - " + _0x172795.proxy : _0x34676a;
};
const fast_login_accounts = async _0x207d14 => {
  const {
    index: _0x6b61a2,
    account: _0x317fec
  } = _0x207d14;
  let _0x4a2054;
  if (process.use_proxy) {
    _0x4a2054 = _0x317fec.proxy || process.proxy[_0x6b61a2 % process.proxy.length];
  }
  const _0x2109af = new Profile(_0x317fec, process.maFiles[_0x317fec.no_replace_login.toLowerCase()], _0x4a2054);
  const _0x35c15c = new Promise((_0x4e77de, _0x20b1ff) => {
    setTimeout(() => {
      _0x20b1ff(new Error("Login timeout"));
    }, msInSecond * 0x19);
  });
  try {
    const _0xdbbd7a = await Promise.race([_0x2109af.login(), _0x35c15c]);
    if (_0xdbbd7a) {
      process.clients[_0x317fec.login] = _0x2109af;
      valid_accounts += _0x317fec.login + ':' + _0x317fec.password + "\r\n";
    } else {
      invalid_accounts += _0x317fec.login + ':' + _0x317fec.password + "\r\n";
    }
  } catch (err: unknown) {
    _0x2109af.removeSteamHandlers();
    _0x2109af.removeEventEmitterHandlers();
    clearInterval(_0x2109af.reloginInterval);
    clearInterval(_0x2109af.weblogonInterval);
    _0x2109af.client.logOff();
    print_info(_0x317fec.login + " Login timedout. " + (_0x4a2054 || ''), 'red');
  }
};
const _0x259c99 = fastq.promise(fast_login_accounts, 0x5);
process.accounts.map((_0x3a8253, _0xad72f3) => _0x259c99.push({
  'account': _0x3a8253,
  'index': _0xad72f3
}));
await _0x259c99.drained();
print_info(process.languages[process.settings.language].all_accounts_logged, "grn");
print_full_day_statistic();
if (process.platform !== "darwin") {
  fs.writeFileSync("./valid_accounts.txt", valid_accounts);
  fs.writeFileSync("./invalid_accounts.txt", invalid_accounts);
}
valid_accounts = '';
invalid_accounts = '';
const _0x4b6bb6 = document.getElementById("auto_remove_locked_accounts").checked;
const _0x5252c6 = document.getElementById("auto_remove_limited_accounts").checked;
if (_0x4b6bb6 || _0x5252c6) {
  remove_locked_accounts(_0x4b6bb6, _0x5252c6);
}
print_info(process.languages[process.settings.language].accounts_loaded + ": " + Object.keys(process.clients).length);
const login_accounts = async (accountIndex = 0, proxyIndex = 0) => {
  try {
    if (accountIndex < process.accounts.length) {
      const account = process.accounts[accountIndex];
      if (!process.clients[account.login]) {
        let proxy = account.proxy;
        if (process.use_proxy && proxy === undefined) {
          if (!process.proxy[proxyIndex]) {
            proxyIndex = 0;
          }
          proxy = process.proxy[proxyIndex];
        }
        ++proxyIndex;
        const steamClient = new Profile(account, process.maFiles[account.no_replace_login.toLowerCase()], proxy);
        const loginResult = await steamClient.login();
        if (loginResult) {
          process.clients[account.login] = steamClient;
          valid_accounts += account.login + ':' + account.password + "\r\n";
        } else {
          invalid_accounts += account.login + ':' + account.password + "\r\n";
        }
        const codeElement = document.querySelector(".code");
        const codeInput = document.getElementById("codeInput") as HTMLInputElement;
        codeInput.value = '';
        codeElement?.classList.add("hide");
        return login_accounts(++accountIndex, ++proxyIndex);
      } else {
        return login_accounts(++accountIndex, ++proxyIndex);
      }
    } else {
      print_info(process.languages[process.settings.language].all_accounts_logged, "grn");
      print_full_day_statistic();
      if (process.platform !== "darwin") {
        fs.writeFileSync("./valid_accounts.txt", valid_accounts);
        fs.writeFileSync("./invalid_accounts.txt", invalid_accounts);
      }
      valid_accounts = '';
      invalid_accounts = '';
      const autoRemoveLocked = document.getElementById("auto_remove_locked_accounts") as HTMLInputElement;
      const autoRemoveLimited = document.getElementById("auto_remove_limited_accounts") as HTMLInputElement;
      if (autoRemoveLocked.checked || autoRemoveLimited.checked) {
        remove_locked_accounts(autoRemoveLocked.checked, autoRemoveLimited.checked);
      }
      print_info(process.languages[process.settings.language].accounts_loaded + ": " + Object.keys(process.clients).length);
      return;
    }
  } catch (err: unknown) {
    return login_accounts(++accountIndex, ++proxyIndex);
  }
};

const set_time = (time: string): number => {
  if (time) {
    const [hours, minutes] = time.split(':');
    const hoursNumber = Number(hours);
    const minutesNumber = Number(minutes);
    const currentDate = new Date();
    const targetDate = new Date();
    targetDate.setHours(hoursNumber);
    targetDate.setMinutes(minutesNumber);
    targetDate.setSeconds(0);
    if (targetDate < currentDate) {
      targetDate.setDate(currentDate.getDate() + 1);
    }
    const timeDifference = targetDate.getTime() - currentDate.getTime();
    return timeDifference;
  } else {
    return 0;
  }
};

const set_states = (selectedAccounts: readonly string[]) => {
  const stateElement = document.getElementById("setStateAll") as HTMLInputElement;
  selectedAccounts.forEach(accountLogin => process.clients[accountLogin].set_persona_state(stateElement.value));
  swal('Success', process.languages[process.settings.language].online_states_changed, 'success');
  localStorage.setItem('selected_online_state', stateElement.value);
};

const play_game = (selectedAccounts: readonly string[], isPlaying: boolean) => {
  const gamesElement = document.getElementById('games_for_boost') as HTMLInputElement;
  selectedAccounts.forEach(accountLogin => process.clients[accountLogin].play_game(gamesElement.value, isPlaying));
  localStorage.setItem("games_for_boost", gamesElement.value);
  swal("Success", '' + (isPlaying ? process.languages[process.settings.language].start_boost : process.languages[process.settings.language].stop_boost), 'success');
};
const clear_invites = async (_0x525293, _0x2e6c86 = "invites") => {
  let _0x4d0c1f;
  input = document.createElement("input");
  input.type = "text";
  input.className = "swal-content__input";
  if (_0x2e6c86 === "invites") {
    input.value = 0x64;
    _0x4d0c1f = await swal({
      'text': process.languages[process.settings.language].percent_invites,
      'content': input,
      'buttons': {
        'cancel': "Cancel",
        'confirm': 'Confirm',
        'invites_by_offline': "Remove by offline"
      }
    });
  } else {
    if (_0x2e6c86 === "friends" || _0x2e6c86 === "invites_by_offline") {
      input.value = '0';
      const _0x3ea3e0 = {
        'text': process.languages[process.settings.language].days_offline_delete + " " + (_0x2e6c86 === "friends" ? process.languages[process.settings.language].null_for_delete_all : ''),
        'content': input,
        'buttons': {
          'cancel': "Cancel",
          'confirm': "Confirm",
          'remove_duplicates': "Remove duplicates",
          'removeByChatMessage': "Remove by chat message"
        }
      };
      if (_0x2e6c86 === "friends") {
        _0x3ea3e0.buttons.friends_by_steamids = "Remove by steamids";
      }
      _0x4d0c1f = await swal(_0x3ea3e0);
    } else if (_0x2e6c86 === "friends_by_steamids") {
      input = document.createElement('textarea');
      input.className = "swal-content__input";
      input.style.resize = "none";
      _0x4d0c1f = await swal({
        'text': process.languages[process.settings.language].remove_by_steamids,
        'content': input,
        'buttons': {
          'cancel': "Cancel",
          'confirm': 'Confirm'
        }
      });
    }
  }
  if (_0x4d0c1f === "remove_duplicates") {
    swal("Success", "Duplicated friends were removed", "success");
    return removeDuplicates(_0x525293);
  }
  if (_0x4d0c1f === 'removeByChatMessage') {
    const _0x4a7589 = document.createElement("input");
    _0x4a7589.type = "text";
    _0x4a7589.className = "swal-content__input";
    const _0xafc235 = await swal({
      'text': process.languages[process.settings.language].removeByMessage,
      'content': _0x4a7589,
      'buttons': {
        'cancel': 'Cancel',
        'confirm': "Confirm"
      }
    });
    const _0x5aa4a0 = _0x4a7589.value.trim();
    if (_0xafc235 && _0x5aa4a0 !== '') {
      _0x525293.forEach(_0x5e9f17 => process.clients[_0x5e9f17].removeByMessageInChat(_0x5aa4a0));
      swal("Success", process.languages[process.settings.language].startRemoveByMessage + " " + _0x5aa4a0, "success");
    } else {
      swal("Error", process.languages[process.settings.language].removeByMessage, 'error');
    }
  }
  if (_0x4d0c1f == true) {
    swal("Success", _0x2e6c86 + " cleared on selected accounts", "success");
    const _0x3c1d72 = fastq.promise(async _0x20c953 => {
      if (_0x2e6c86 === "invites" || _0x2e6c86 === "invites_by_offline") {
        process.clients[_0x20c953].clear_invites(Number(input.value), _0x2e6c86);
      } else {
        process.clients[_0x20c953].clear_friends(input.value, _0x2e6c86);
      }
      await wait(0x1388);
    }, 0x1f4);
    _0x525293.map(_0x3c3e7a => _0x3c1d72.push(_0x3c3e7a));
    await _0x3c1d72.drained();
  } else {
    if (_0x4d0c1f === "invites_by_offline" || _0x4d0c1f === "friends_by_steamids") {
      return clear_invites(_0x525293, _0x4d0c1f);
    }
  }
};
const invite_friends = async _0x569ec1 => {
  const _0x8be303 = new Date();
  const _0x1ea2d = document.getElementById("invite_time").value.trim();
  const _0x4a66c8 = document.getElementById('use_invite_blacklist').checked;
  const _0x5e40c1 = document.getElementById('delete_duplicates').checked;
  process.settings.use_invite_blacklist = _0x4a66c8;
  process.user_id_list = document.getElementById("idLoadArea").value.trim().split(/\r?\n| /).filter(_0x2f843d => _0x2f843d !== '');
  process.user_index = 0x0;
  process.successfully_added = 0x0;
  process.excess = [];
  process.settings.invite_count = Number(document.getElementById('invite_count').value) || 0x1e;
  process.settings.invite_timeout = Number(document.getElementById("invite_timeout").value) * 0x3e8 || 0xbb8;
  let _0x55f1c2 = process.user_id_list.length;
  if (_0x5e40c1) {
    process.user_id_list = [...new Set(process.user_id_list)];
  }
  if (_0x4a66c8) {
    process.user_id_list = process.user_id_list.filter(_0x34e723 => !process.invite_blacklist.has(_0x34e723));
  }
  process.settings.friends_add_comment = document.getElementById("friends_add_comment").value.trim();
  process.user_id_list_length = process.user_id_list.length;
  _0x55f1c2 -= process.user_id_list_length;
  localStorage.setItem("use_invite_blacklist", _0x4a66c8);
  localStorage.setItem("delete_duplicates", _0x5e40c1);
  localStorage.setItem("friends_add_comment", process.settings.friends_add_comment);
  localStorage.setItem('invite_count', process.settings.invite_count);
  if (process.user_id_list_length > 0x0) {
    const _0x385d80 = {};
    _0x569ec1.forEach(_0x279e31 => _0x385d80[_0x279e31] = true);
    const _0x4a7504 = set_time(_0x1ea2d);
    swal('Success', (_0x4a7504 === 0x0 ? process.languages[process.settings.language].inviter_started : process.languages[process.settings.language].inviter_will_start + " " + _0x1ea2d) + ". " + process.helper.replace_log_variable(process.languages[process.settings.language].steamid_loaded, ['' + process.user_id_list.length, '' + _0x55f1c2]), "success");
    const _0x396ddc = setTimeout(async () => {
      await Promise.all(_0x569ec1.map(_0x1cf0f7 => {
        return process.clients[_0x1cf0f7].invite_cycle();
      }));
      let _0x3b48aa = process.user_id_list.slice(process.user_index, process.user_id_list_length);
      _0x3b48aa.push(...process.excess);
      _0x3b48aa = _0x3b48aa.join("\n");
      const _0x3f60d6 = new Date();
      const _0x3e844a = _0x8be303.toLocaleString();
      const _0x60c92a = _0x3f60d6.toLocaleString();
      const _0x2213e1 = _0x3e844a + " - " + _0x60c92a;
      print_info(process.helper.replace_log_variable('' + process.languages[process.settings.language].invite_stopped, ['' + pretty_time(_0x3f60d6), '' + process.successfully_added]), "yellow");
      localStorage.setItem("last_invite", _0x2213e1 + ". Invites sent: " + process.successfully_added);
      const _0x1db188 = document.getElementById("actions_choose_account_groups").value;
      if (_0x1db188 !== "null") {
        localStorage.setItem("last_invite_" + _0x1db188, _0x2213e1 + ". Invites sent: " + process.successfully_added);
      }
      document.getElementById('idLoadArea').value = _0x3b48aa;
      document.getElementById("last_invite").innerText = _0x2213e1 + ". Invites sent: " + process.successfully_added;
      process.storage.saveFile("id_for_invite.txt", _0x3b48aa);
      if (process.settings.use_invite_blacklist) {
        process.storage.saveFile("invite_blacklist.txt", Array.from(process.invite_blacklist).join("\n"));
      }
      const _0x22975c = Number(document.getElementById("reinvite_time").value);
      if (_0x22975c > 0x0) {
        print_info(process.helper.replace_log_variable(process.languages[process.settings.language].reinvite, ['' + _0x22975c]));
        const _0x4eeb0f = setTimeout(() => {
          actions({
            'action_name': "invite_friends"
          });
        }, _0x22975c * 0x36ee80);
        document.getElementById("reinvite_time_off").onclick = () => stop_respam(_0x4eeb0f, "reinvite");
      }
    }, _0x4a7504);
    document.getElementById("invite_time_off").onclick = () => stop_respam(_0x396ddc, "invite_time");
  } else {
    swal('Error', process.languages[process.settings.language].import_steamid_list, "error");
  }
};
const choose_online_state_for_spam = (_0x4e1cc8, _0x195370) => {
  const _0x120e4c = document.querySelectorAll('.' + _0x195370);
  const _0x2c3eab = _0x4e1cc8.currentTarget;
  for (let _0x377f14 = 0x0; _0x377f14 < _0x120e4c.length; _0x377f14++) {
    const _0x10eb46 = _0x120e4c[_0x377f14];
    if (_0x2c3eab.checked && _0x10eb46 !== _0x2c3eab) {
      _0x10eb46.disabled = true;
      _0x10eb46.checked = false;
    } else if (!_0x2c3eab.checked && _0x10eb46 !== _0x2c3eab) {
      _0x10eb46.disabled = false;
      _0x10eb46.checked = false;
    }
  }
};
const spam_all = async (_0x34c9e2, _0xb2bfba) => {
  const _0xced252 = document.getElementById("spam_all_message").value.trim();
  if (_0xced252) {
    localStorage.setItem("spam_all_message", _0xced252);
    process.settings.spam_all_message = _0xced252;
    const _0x58f93c = document.querySelectorAll(".spam_online_state:checked");
    const _0x1fdcdd = {};
    const _0x19dc8 = document.getElementById('send_spammed_users').checked;
    if (_0x58f93c.length > 0x0) {
      for (let _0x45d51a = 0x0; _0x45d51a < _0x58f93c.length; _0x45d51a++) {
        _0x1fdcdd[_0x58f93c[_0x45d51a].dataset.online_state] = true;
      }
      swal("Success", process.languages[process.settings.language].spamming_selected_users, "success");
      const _0x2a00d5 = fastq.promise(async _0x1f753d => {
        await process.clients[_0x1f753d].spam_account(_0x1fdcdd, _0x19dc8, _0xb2bfba);
      }, 0x1f4);
      _0x34c9e2.map(_0x323e1b => _0x2a00d5.push(_0x323e1b));
      await _0x2a00d5.drained();
      print_info(process.languages[process.settings.language].spam_all_finished, "yellow");
      const _0x3bf377 = Number(document.getElementById("respam_time").value);
      if (_0x3bf377 > 0x0) {
        print_info(process.helper.replace_log_variable(process.languages[process.settings.language].respam, ['' + _0x3bf377]));
        const _0x5f45f8 = setTimeout(() => {
          spam_all(_0x34c9e2, _0xb2bfba);
        }, _0x3bf377 * 0x36ee80);
        document.getElementById("spam_all_respam_off").onclick = () => stop_respam(_0x5f45f8, 'respam');
      }
    } else {
      swal("Error", process.languages[process.settings.language].choose_online_states, "error");
    }
  } else {
    swal("Error", process.languages[process.settings.language].provide_message, 'error');
  }
};
const wall_spam = async _0x523c1 => {
  const _0x18c99c = document.getElementById("use_wall_spam_blacklist").checked;
  const _0x431179 = document.getElementById("wall_spam_message").value.trim();
  const _0x52fe5e = Number(document.getElementById("wall_spam_message_timeout").value.trim()) || 0x2;
  process.wall_spam_id_list = document.getElementById('wall_spam_id').value.trim().split(/\r?\n| /).filter(_0x4f858d => _0x4f858d !== '');
  process.settings.wall_spam_message_timeout = _0x52fe5e * 0x3e8;
  process.wall_spam_user_index = 0x0;
  process.successfully_wall_spammed = 0x0;
  let _0x580513 = process.wall_spam_id_list.length;
  if (_0x18c99c) {
    process.wall_spam_id_list = process.wall_spam_id_list.filter(_0xa6d4d2 => !process.wall_spam_blacklist[_0xa6d4d2]);
  }
  process.wall_spam_id_list_length = process.wall_spam_id_list.length;
  _0x580513 -= process.wall_spam_id_list_length;
  localStorage.setItem('use_wall_spam_blacklist', _0x18c99c);
  if (_0x431179 && process.wall_spam_id_list_length > 0x0) {
    process.excess = [];
    const _0x2368df = {};
    _0x523c1.forEach(_0x49f66f => _0x2368df[_0x49f66f] = true);
    localStorage.setItem("wall_spam_message", _0x431179);
    localStorage.setItem("wall_spam_message_timeout", _0x52fe5e);
    process.settings.wall_spam_messages = _0x431179.split(';');
    process.settings.wall_spam_message_count = Number(document.getElementById("wall_spam_message_count").value.trim());
    swal("Success", process.languages[process.settings.language].wall_spammer_started + ". " + process.helper.replace_log_variable(process.languages[process.settings.language].steamid_loaded, ['' + process.wall_spam_id_list_length, '' + _0x580513]), "success");
    const _0x12ffec = fastq.promise(async _0x5c5981 => {
      await process.clients[_0x5c5981].wall_spam_cycle();
    }, 0x1f4);
    _0x523c1.map(_0x5ec1c8 => _0x12ffec.push(_0x5ec1c8));
    await _0x12ffec.drained();
    let _0xf23499 = process.wall_spam_id_list.slice(process.wall_spam_user_index, process.wall_spam_id_list_length);
    _0xf23499.push(...process.excess);
    _0xf23499 = _0xf23499.join("\n");
    const _0xe49252 = new Date();
    const _0x134a2d = _0xe49252.toLocaleDateString(process.settings.language === 'ru' ? 'ru-RU' : 'en-US', {
      'weekday': 'long',
      'year': 'numeric',
      'month': "long",
      'day': "numeric",
      'hour': 'numeric',
      'minute': "numeric",
      'second': 'numeric'
    });
    print_info(process.helper.replace_log_variable(process.languages[process.settings.language].wall_spam_finished, [_0xe49252.getHours() + ':' + _0xe49252.getMinutes(), '' + process.successfully_wall_spammed]), "yellow");
    localStorage.setItem('last_wall_spam', '' + _0x134a2d);
    process.storage.saveFile("wall_spam_id.txt", _0xf23499);
    process.storage.saveFile("wall_spam_blacklist.txt", Object.keys(process.wall_spam_blacklist).join("\n"));
    document.getElementById("wall_spam_id").value = _0xf23499;
    document.getElementById("last_wall_spam").innerText = '' + _0x134a2d;
    const _0x3b9f3a = Number(document.getElementById("wall_respam_time").value);
    if (_0x3b9f3a > 0x0) {
      print_info(process.helper.replace_log_variable(process.languages[process.settings.language].respam, ['' + _0x3b9f3a]));
      const _0x2df1db = setTimeout(() => {
        actions({
          'action_name': 'wall_spam'
        });
      }, _0x3b9f3a * 0x36ee80);
      document.getElementById("wall_spam_respam_off").onclick = () => stop_respam(_0x2df1db, 'respam');
    }
  } else {
    swal('Error', process.languages[process.settings.language].provide_message_or_id_list, "error");
  }
};
const hold_deleter = async _0x41db5b => {
  input = document.createElement("input");
  input.type = "text";
  input.className = "swal-content__input";
  input.value = 0x0;
  const _0x56c10c = await swal({
    'text': process.languages[process.settings.language].enter_escrow_days,
    'content': input,
    'buttons': {
      'cancel': "Cancel",
      'confirm': 'OK'
    }
  });
  if (_0x56c10c) {
    _0x41db5b.forEach(_0x1c98f1 => process.clients[_0x1c98f1].delete_hold_users(Number(input.value) || 0x0));
    swal('Success', process.languages[process.settings.language].deleting_hold_users, "success");
  }
};
const set_ui_mode = _0xbee9a0 => {
  const _0x1d7daa = document.getElementById("ui_mode").value;
  _0xbee9a0.forEach(_0x4607b5 => process.clients[_0x4607b5].set_ui_mode(_0x1d7daa));
  swal("Success", process.languages[process.settings.language].ui_mode_changed, "success");
};
const actions = async ({
  action_name: _0x35d4d0,
  is_play: _0x1d8fff
}) => {
  const _0x29577e = document.querySelectorAll(".action_checkbox");
  if (_0x29577e.length > 0x0) {
    let _0x2a7530 = [];
    for (let _0xc44e57 = 0x0; _0xc44e57 < _0x29577e.length; _0xc44e57++) {
      if (_0x29577e[_0xc44e57].checked) {
        _0x2a7530.push(_0x29577e[_0xc44e57].dataset.login);
      }
    }
    _0x2a7530 = _0x2a7530.filter(_0x21aaad => process.clients[_0x21aaad]);
    if (_0x2a7530.length > 0) {
      if (_0x35d4d0 === 'set_online_state') {
        set_states(_0x2a7530);
      } else {
        if (_0x35d4d0 === "play_game") {
          play_game(_0x2a7530, _0x1d8fff);
        } else {
          if (_0x35d4d0 === "clear_invites") {
            clear_invites(_0x2a7530);
          } else {
            if (_0x35d4d0 === "spam_all") {
              spam_all(_0x2a7530);
            } else {
              if (_0x35d4d0 === 'spam_pinned') {
                spam_all(_0x2a7530, "spam_pinned");
              } else {
                if (_0x35d4d0 === "invite_friends") {
                  invite_friends(_0x2a7530);
                } else {
                  if (_0x35d4d0 === "wall_spam") {
                    wall_spam(_0x2a7530);
                  } else {
                    if (_0x35d4d0 === 'hold_deleter') {
                      hold_deleter(_0x2a7530);
                    } else {
                      if (_0x35d4d0 === 'clear_friends') {
                        clear_invites(_0x2a7530, 'friends');
                      } else {
                        if (_0x35d4d0 === "change_privacy") {
                          change_privacy(_0x2a7530);
                        } else {
                          if (_0x35d4d0 === "change_profile") {
                            change_profile(_0x2a7530);
                          } else {
                            if (_0x35d4d0 === "change_avatar") {
                              change_avatar(_0x2a7530);
                            } else {
                              if (_0x35d4d0 === "set_ui_mode") {
                                set_ui_mode(_0x2a7530);
                              } else {
                                if (_0x35d4d0 === "pin_by_online_state") {
                                  pinUsers(_0x2a7530, 'pin_by_online_state');
                                } else {
                                  if (_0x35d4d0 === "clear_name_history") {
                                    clear_name_history(_0x2a7530);
                                  } else {
                                    if (_0x35d4d0 === "community_tasks") {
                                      community_tasks(_0x2a7530);
                                    } else {
                                      if (_0x35d4d0 === "check_friends_limit") {
                                        check_friends_limit(_0x2a7530);
                                      } else {
                                        if (_0x35d4d0 === "pin_by_message_history") {
                                          pinUsers(_0x2a7530, "pin_by_message_history");
                                        } else {
                                          if (_0x35d4d0 === 'clear_comments') {
                                            clear_comments(_0x2a7530);
                                          } else {
                                            if (_0x35d4d0 === 'join_group') {
                                              join_group(_0x2a7530);
                                            } else {
                                              if (_0x35d4d0 === 'invite_group') {
                                                invite_group(_0x2a7530);
                                              } else {
                                                if (_0x35d4d0 === "accept_invites") {
                                                  accept_invites(_0x2a7530);
                                                } else {
                                                  if (_0x35d4d0 === "create_invite_link") {
                                                    create_invite_link(_0x2a7530);
                                                  } else {
                                                    if (_0x35d4d0 === 'start_remove_friends_by_price') {
                                                      remove_friends_by_price(_0x2a7530);
                                                    } else {
                                                      if (_0x35d4d0 === "get_api_keys") {
                                                        getApiKeys(_0x2a7530);
                                                      } else {
                                                        if (_0x35d4d0 === "change_password") {
                                                          changePasswords(_0x2a7530);
                                                        } else {
                                                          if (_0x35d4d0 === "unblock_friends") {
                                                            unblockFriends(_0x2a7530);
                                                          } else {
                                                            if (_0x35d4d0 === "pin_by_unread_messages") {
                                                              pinUsers(_0x2a7530, "pin_by_unread_messages");
                                                            } else {
                                                              if (_0x35d4d0 === 'addFreeGames') {
                                                                addFreeGames(_0x2a7530);
                                                              } else {
                                                                if (_0x35d4d0 === "setupProfileBackground") {
                                                                  setupProfileBackground(_0x2a7530);
                                                                } else {
                                                                  if (_0x35d4d0 === "setFavoriteBadge") {
                                                                    setupFavoriteBadges(_0x2a7530);
                                                                  } else {
                                                                    if (_0x35d4d0 === "setStats") {
                                                                      setStats(_0x2a7530);
                                                                    } else {
                                                                      if (_0x35d4d0 === "getYearReviewBadge") {
                                                                        getYearReviewBadge(_0x2a7530);
                                                                      } else {
                                                                        if (_0x35d4d0 === 'clear_incoming_invites') {
                                                                          clear_incoming_invites(_0x2a7530);
                                                                        } else {
                                                                          if (_0x35d4d0 === "setAvatarFrame") {
                                                                            setAvatarFrame(_0x2a7530);
                                                                          } else if (_0x35d4d0 === "export_friends") {
                                                                            exportFriends(_0x2a7530);
                                                                          }
                                                                        }
                                                                      }
                                                                    }
                                                                  }
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      swal('Error', process.languages[process.settings.language].choose_accounts, "error");
    }
  } else {
    swal("Error", process.languages[process.settings.language].choose_accounts, 'error');
  }
};
const exportFriends = _0x2e6f26 => {
  const _0x317057 = path.join(os.homedir(), 'Desktop', "friends.txt");
  const _0x26edc1 = fs.createWriteStream(_0x317057);
  for (let _0x4a9eb9 = 0x0; _0x4a9eb9 < _0x2e6f26.length; _0x4a9eb9++) {
    try {
      const _0x2e6b29 = _0x2e6f26[_0x4a9eb9];
      const _0x1a6f1f = process.clients[_0x2e6b29];
      for (const _0x422012 in _0x1a6f1f.users) {
        if (_0x1a6f1f.myFriends[_0x422012] === 0x3) {
          _0x26edc1.write(_0x422012 + "\r\n");
        }
      }
    } catch (err: unknown) {}
  }
  _0x26edc1.close();
  swal("Success", "Your friends exported to a Desktop", 'success');
};
const getYearReviewBadge = async _0x136a87 => {
  swal("Success", "Year Review Badge unlocking started", "success");
  for (let _0x332a86 = 0x0; _0x332a86 < _0x136a87.length; _0x332a86++) {
    const _0x561ab8 = _0x136a87[_0x332a86];
    try {
      await process.clients[_0x561ab8].getYearReviewBadge();
      process.helper.print_info(_0x561ab8 + " Year Review Badge Unlocked", "grn");
    } catch (err: unknown) {
      process.helper.print_info(_0x561ab8 + " Can't unlock Year Review Badge", "red");
    }
  }
};
const setStats = async _0x29358d => {
  swal('Success', "Achievement unlocking started", "success");
  for (let _0x30c15d = 0x0; _0x30c15d < _0x29358d.length; _0x30c15d++) {
    const _0x51e50f = _0x29358d[_0x30c15d];
    try {
      const {
        crc_stats: _0x54ef92
      } = await process.clients[_0x51e50f].getStats(0x2da);
      await process.clients[_0x51e50f].setStats({
        'gameID': 0x2da,
        'stats': [{
          'stat_id': 0x166,
          'stat_value': 0x1
        }],
        'crc_stats': _0x54ef92
      });
      process.helper.print_info(_0x51e50f + " CS2 Achievement Unlocked", "grn");
    } catch (err: unknown) {
      process.helper.print_info(_0x51e50f + " Can't unlock CS2 Achievement", 'red');
    }
  }
};
const setupProfileBackground = async _0x2c8d7b => {
  swal("Success", process.languages[process.settings.language].setupProfileBackgroundStarted, "success");
  for (let _0xa61a48 = 0x0; _0xa61a48 < _0x2c8d7b.length; _0xa61a48++) {
    const _0x1fc5fd = _0x2c8d7b[_0xa61a48];
    await process.clients[_0x1fc5fd].setupProfileBackground();
  }
};
const setupFavoriteBadges = async _0x337bfe => {
  swal('Success', process.languages[process.settings.language].setupProfileBackgroundStarted, 'success');
  for (let _0x4079cc = 0x0; _0x4079cc < _0x337bfe.length; _0x4079cc++) {
    const _0x152109 = _0x337bfe[_0x4079cc];
    const _0x5c98b5 = process.clients[_0x152109];
    try {
      const {
        badges: _0x4d7200,
        access_token: _0x44af05
      } = await _0x5c98b5.getBadges();
      if (_0x4d7200.length !== 0x0 && _0x44af05) {
        const {
          badgeid: _0x311407,
          name: _0x59cae6
        } = _0x4d7200[random(_0x4d7200.length - 0x1)];
        await _0x5c98b5.setFavoriteBadge(_0x311407, _0x44af05);
        process.helper.print_info(_0x152109 + " set badge " + _0x59cae6, 'grn');
      } else {
        process.helper.print_info(_0x152109 + " No badges", "yellow");
      }
    } catch (err: unknown) {
      process.helper.print_info(_0x152109 + " Setup badges error: " + err, "red");
    }
  }
};
const setAvatarFrame = async _0x44242f => {
  swal("Success", "Setting avatar frame started", "success");
  const _0x4edece = fastq.promise(async _0xf8887b => {
    const _0x24330a = process.clients[_0xf8887b];
    try {
      const _0x41b689 = await _0x24330a.getWebapiToken();
      const _0x33c650 = await _0x24330a.getOwnedProfileItems(_0x41b689);
      if (Array.isArray(_0x33c650.response.avatar_frames) && _0x33c650.response.avatar_frames.length !== 0x0) {
        const _0x37993e = _0x33c650.response.avatar_frames[random(_0x33c650.response.avatar_frames.length - 0x1)];
        await _0x24330a.setAvatarFrame(_0x37993e.communityitemid, _0x41b689);
        process.helper.print_info(_0xf8887b + ": Set frame " + _0x37993e.name, "grn");
      } else {
        process.helper.print_info(_0xf8887b + ": no frames available", "yellow");
      }
    } catch (err: unknown) {
      process.helper.print_info(_0xf8887b + ": " + err, "err");
    }
  }, 0x5);
  _0x44242f.map(_0x5d99de => _0x4edece.push(_0x5d99de));
  await _0x4edece.drained();
  process.helper.print_info("Setting avatar frame finished", "yellow");
};
const addFreeGames = async _0x754e70 => {
  swal("Success", process.languages[process.settings.language].addFreeGamesStarted, "success");
  const _0x4d8621 = async _0x4a0824 => new Promise(_0x477f8f => setTimeout(_0x477f8f, _0x4a0824));
  for (let _0x409342 = 0x0; _0x409342 < _0x754e70.length; _0x409342++) {
    const _0xa6e8d7 = _0x754e70[_0x409342];
    try {
      await process.clients[_0xa6e8d7].addFreeGames();
      process.helper.print_info(_0xa6e8d7 + " " + process.languages[process.settings.language].addedFreeGames, "grn");
    } catch (err: unknown) {
      logger.error("addFreeGames " + _0xa6e8d7 + " " + err.toString());
    }
    await _0x4d8621(0x2710);
  }
};
const choose_all_accounts_actions = _0x1d7a98 => {
  const _0x16f831 = document.querySelectorAll('.action_checkbox');
  for (let _0x41cd99 = 0x0; _0x41cd99 < _0x16f831.length; _0x41cd99++) {
    _0x16f831[_0x41cd99].checked = _0x1d7a98.currentTarget.checked;
  }
};
const open_custom_url = async _0x42a4a5 => {
  const _0x51c8ac = await swal({
    'text': process.languages[process.settings.language].enter_url,
    'content': 'input',
    'buttons': {
      'cancel': "Cancel",
      'confirm': "Open"
    }
  });
  if (_0x51c8ac) {
    const _0x42a803 = _0x51c8ac.startsWith("http") ? _0x51c8ac : "https://" + _0x51c8ac;
    open_link_browser(_0x42a4a5, _0x42a803);
  }
};
const get_steam_guard_code = _0x514914 => {
  const _0x1d6aaf = process.clients[_0x514914];
  swal('' + (_0x1d6aaf.maFile ? '' + SteamTotp.getAuthCode(_0x1d6aaf.maFile.shared_secret, process.steamTimeOffset) : process.languages[process.settings.language].account_not_using_mafile));
};
const mute = (_0x22dcc3, _0x49c41c, _0x230d1e = 'mute') => {
  const _0x400cfa = process.clients[_0x22dcc3];
  const _0x519654 = document.querySelectorAll(".muted_" + _0x49c41c + '_' + _0x22dcc3);
  if (_0x230d1e === "mute") {
    _0x400cfa.muted[_0x49c41c] = 0x1;
    _0x400cfa.spammed[_0x49c41c] = 0x1;
  } else {
    delete _0x400cfa.muted[_0x49c41c];
    delete _0x400cfa.spammed[_0x49c41c];
  }
  localStorage.setItem(_0x22dcc3 + '_muted', JSON.stringify(_0x400cfa.muted));
  for (let _0x4da7bb = 0x0; _0x4da7bb < _0x519654.length; _0x4da7bb++) {
    _0x519654[_0x4da7bb].innerHTML = '' + (_0x230d1e === "mute" ? "<img src=\"./img/mute.png\">" : '');
  }
};
const show_user_actions_list = (_0x44497d, _0x1114ef, _0x5ab157, _0x9a6ddc = "user_actions_list") => {
  _0x44497d.stopPropagation();
  _0x44497d.preventDefault();
  const _0x4d1558 = document.body.scrollHeight;
  const {
    top: _0xc4e88d,
    left: _0x32949d
  } = _0x44497d.currentTarget.getBoundingClientRect();
  const _0x1f90db = process.clients[_0x1114ef];
  const _0x307770 = document.querySelector('.' + _0x9a6ddc);
  _0x307770.style.height = 'auto';
  _0x307770.classList.remove("hide");
  if (_0x9a6ddc === "user_actions_list") {
    const _0x5c0ede = _0xc4e88d + 0x19;
    _0x307770.style.left = _0x32949d + 0x19 + 'px';
    const _0x1eb15e = document.getElementById("delete_action");
    const _0x54d303 = document.getElementById("block_action");
    const _0x503f38 = document.getElementById("add_deleted_friend_action");
    const _0x1cd7a0 = document.getElementById("remove_deleted_friend_action");
    const _0x14f196 = document.getElementById("unblock_deleted_friend_action");
    const _0xfb57be = document.getElementById('mute_user');
    const _0x4bda3a = document.getElementById('unmute_user');
    const _0x4b9d8e = document.getElementById('pin_to_top');
    document.getElementById("check_user_trade").onclick = async () => {
      const {
        status: _0x1dce5b,
        message: _0x28b1f1
      } = await _0x1f90db.check_user_trade(_0x5ab157);
      const _0x317a6e = _0x1dce5b ? "success" : "error";
      swal(_0x317a6e, _0x28b1f1, _0x317a6e);
    };
    document.getElementById('set_nickname_action').onclick = () => _0x1f90db.new_name_modal(_0x5ab157);
    _0x1eb15e.onclick = () => _0x1f90db.delete_friend(_0x5ab157);
    _0x54d303.onclick = () => _0x1f90db.delete_friend(_0x5ab157, "block");
    _0x503f38.onclick = () => _0x1f90db.invite_to_friend(_0x5ab157);
    _0x1cd7a0.onclick = () => _0x1f90db.remove_deleted_friend(_0x5ab157);
    _0x14f196.onclick = () => _0x1f90db.unblock_friend(_0x5ab157);
    document.getElementById("steam_profile_browser_action").onclick = () => open_link_browser(_0x1f90db.account.login, "https://steamcommunity.com/profiles/" + _0x5ab157 + '/');
    document.getElementById("steam_profile_action").onclick = () => shell.openExternal("https://steamcommunity.com/profiles/" + _0x5ab157 + '/');
    document.getElementById("steam_inventory_action").onclick = () => shell.openExternal('https://steamcommunity.com/profiles/' + _0x5ab157 + '/inventory/');
    document.getElementById("steam_tools_csgo_action").onclick = () => shell.openExternal('https://steam.tools/itemvalue/#/' + _0x5ab157 + "-730");
    document.getElementById('steam_tools_dota_action').onclick = () => shell.openExternal("https://steam.tools/itemvalue/#/" + _0x5ab157 + '-570');
    document.getElementById("backpack_tf_action").onclick = () => shell.openExternal("https://backpack.tf/profiles/" + _0x5ab157);
    document.getElementById("dotabuff_action").onclick = () => shell.openExternal("https://www.dotabuff.com/players/" + _0x5ab157);
    document.getElementById("copy_user_id_actions").onclick = () => {
      process.clipboard.writeText(_0x5ab157);
      swal('Success', process.languages[process.settings.language].userid_copied);
    };
    document.getElementById("copy_username_actions").onclick = () => {
      process.clipboard.writeText(_0x1f90db.users[_0x5ab157].render_player_name);
      swal('Success', process.languages[process.settings.language].username_copied);
    };
    _0xfb57be.onclick = () => mute(_0x1114ef, _0x5ab157);
    unmute_user.onclick = () => mute(_0x1114ef, _0x5ab157, "unmute");
    _0x4b9d8e.onclick = () => {
      const _0x39ca58 = document.querySelector(".lastMessages .row_user_" + _0x5ab157 + '_' + _0x1f90db.account.login);
      if (_0x39ca58) {
        _0x39ca58.classList.remove("order_" + _0x39ca58.style.order);
        _0x39ca58.style.order = --process.min_order_index;
        _0x39ca58.classList.add("order_" + _0x39ca58.style.order);
      }
    };
    document.getElementById("open_my_profile").onclick = () => open_link_browser(_0x1f90db.account.login, "https://steamcommunity.com/profiles/" + _0x1f90db.clientSteamID64 + '/');
    const _0x2c8de6 = _0x307770.offsetHeight + 0x19;
    if (_0x5c0ede + _0x2c8de6 >= _0x4d1558) {
      const _0x3dfed2 = _0x5c0ede - _0x2c8de6;
      if (_0x3dfed2 > 0x0) {
        _0x307770.style.top = _0x3dfed2 + 'px';
      } else {
        const _0xc7d844 = _0x307770.clientHeight + _0x3dfed2;
        _0x307770.style.top = "25px";
        _0x307770.style.height = _0xc7d844 + 'px';
      }
    } else {
      _0x307770.style.top = _0x5c0ede + 'px';
    }
    document.querySelector(".header_content_menu").classList.add('hide');
    if (!process.customize_settings.mute_user) {
      if (_0x1f90db.muted[_0x5ab157]) {
        _0xfb57be.classList.add('hide');
        _0x4bda3a.classList.remove("hide");
      } else {
        _0x4bda3a.classList.add("hide");
        _0xfb57be.classList.remove("hide");
      }
    }
    if (!process.customize_settings.pin_to_top) {
      if (_0x1f90db.pinned[_0x5ab157]) {
        _0x4b9d8e.classList.remove("hide");
      } else {
        _0x4b9d8e.classList.add("hide");
      }
    }
    if (_0x1f90db.deleted_friends[_0x5ab157]) {
      _0x1eb15e.classList.add('hide');
      _0x54d303.classList.add('hide');
      _0x503f38.classList.remove("hide");
      _0x1cd7a0.classList.remove("hide");
      _0x14f196.classList.remove('hide');
    } else {
      if (!process.customize_settings.delete_action) {
        _0x1eb15e.classList.remove('hide');
      }
      if (!process.customize_settings.block_action) {
        _0x54d303.classList.remove("hide");
      }
      _0x503f38.classList.add("hide");
      _0x1cd7a0.classList.add("hide");
      _0x14f196.classList.add("hide");
    }
  } else {
    if (_0x9a6ddc === "header_content_menu") {
      const _0xb90b04 = _0xc4e88d + _0x44497d.currentTarget.clientHeight / 0x2;
      document.getElementById("pending_invites").onclick = () => _0x1f90db.invites_modal();
      document.getElementById("account_page").onclick = () => shell.openExternal("https://steamcommunity.com/profiles/" + _0x1f90db.clientSteamID64 + '/');
      document.getElementById('open_profile').onclick = () => open_link_browser(_0x1f90db.account.login, 'https://steamcommunity.com/profiles/' + _0x1f90db.clientSteamID64 + '/');
      document.getElementById("open_custom_url").onclick = () => open_custom_url(_0x1f90db.account.login);
      document.getElementById("get_steam_guard_code").onclick = () => get_steam_guard_code(_0x1f90db.account.login);
      document.getElementById("remove_banned_account").onclick = () => remove_banned_account(_0x1f90db.account.login);
      document.getElementById("show_statistic").onclick = () => show_statistic(_0x1f90db.account.login);
      document.getElementById("set_account_name").onclick = () => set_account_name(_0x1f90db.account.login);
      document.getElementById("mute_all_friends").onclick = () => mute_all_friends(_0x1f90db.account.login, 'mute');
      document.getElementById("unmute_all_friends").onclick = () => mute_all_friends(_0x1f90db.account.login, "unmute");
      document.getElementById('confirm_market_listing').onclick = () => _0x1f90db.acceptAllConfirmations(0x3);
      document.getElementById('confirm_trade_offers').onclick = () => _0x1f90db.acceptAllConfirmations(0x2);
      if (!_0x1f90db.maFile) {
        document.getElementById("confirm_market_listing").classList.add("hide");
        document.getElementById('confirm_trade_offers').classList.add('hide');
      } else {
        document.getElementById("confirm_market_listing").classList.remove("hide");
        document.getElementById("confirm_trade_offers").classList.remove('hide');
      }
      _0x307770.style.top = _0xc4e88d + _0x44497d.currentTarget.clientHeight / 0x2 + 'px';
      _0x307770.style.left = _0x32949d + _0x44497d.currentTarget.clientWidth - 0x5 + 'px';
      const _0x902928 = _0x307770.offsetHeight + 0x19;
      if (_0xb90b04 + _0x902928 >= _0x4d1558) {
        _0x307770.style.top = _0xb90b04 - _0x902928 + 'px';
        const _0x51a391 = _0xb90b04 - _0x902928;
        if (_0x51a391 > 0x0) {
          _0x307770.style.top = _0x51a391 + 'px';
        } else {
          const _0x4cfd26 = _0x307770.clientHeight + _0x51a391;
          _0x307770.style.top = "25px";
          _0x307770.style.height = _0x4cfd26 + 'px';
        }
      } else {
        _0x307770.style.top = _0xb90b04 + 'px';
      }
      document.querySelector(".user_actions_list").classList.add("hide");
    }
  }
  document.getElementById('friendsModal').classList.add("no_scroll");
};
const select_accounts_from_group = () => {
  const _0xe0db6e = document.getElementById("accounts_groups_select");
  const _0x20f869 = _0xe0db6e.value;
  const _0x225190 = process.account_groups[_0x20f869];
  if (_0x20f869 !== 'null') {
    if (_0x225190) {
      document.getElementById('accountsLoadArea').value = _0x225190;
    } else {
      swal('Error', process.languages[process.settings.language].no_accounts_for_this_group, "error");
    }
  }
};
const add_accounts_group = () => {
  const _0xce3e5e = document.getElementById('accounts_group_name').value.trim();
  const _0x4e121e = document.getElementById("accounts_group_area").value.trim();
  const _0x4d9c0a = document.getElementById("accounts_groups_select");
  const _0x1c44ab = document.getElementById("actions_choose_account_groups");
  const _0x210fd7 = document.getElementById("friends_choose_account_groups");
  if (_0xce3e5e) {
    process.account_groups[_0xce3e5e] = _0x4e121e;
    const _0x25b89e = document.getElementById("accounts_group_" + _0xce3e5e);
    if (!_0x25b89e) {
      _0x4d9c0a.insertAdjacentHTML("beforeend", "<option value=\"" + _0xce3e5e + "\" id=\"accounts_group_" + _0xce3e5e + "\">" + _0xce3e5e + '</option>');
      _0x1c44ab.insertAdjacentHTML("beforeend", "<option value=\"" + _0xce3e5e + "\" id=\"actions_choose_account_groups_" + _0xce3e5e + "\">" + _0xce3e5e + "</option>");
      _0x210fd7.insertAdjacentHTML('beforeend', "<option value=\"" + _0xce3e5e + "\" id=\"friends_choose_account_groups_" + _0xce3e5e + "\">" + _0xce3e5e + "</option>");
    }
    localStorage.setItem("account_groups", JSON.stringify(process.account_groups));
    swal("Success", process.languages[process.settings.language].accounts_group_added, "success");
  } else {
    swal("Error", process.languages[process.settings.language].enter_accounts_group_name, "error");
  }
};
const remove_accounts_group = () => {
  const _0x599e2c = document.getElementById("accounts_group_name").value.trim();
  if (Object(process.account_groups).hasOwnProperty(_0x599e2c)) {
    delete process.account_groups[_0x599e2c];
    document.getElementById('accounts_group_' + _0x599e2c).remove();
    document.getElementById("actions_choose_account_groups_" + _0x599e2c).remove();
    document.getElementById("friends_choose_account_groups_" + _0x599e2c).remove();
    localStorage.setItem("account_groups", JSON.stringify(process.account_groups));
    swal("Success", process.languages[process.settings.language].accounts_group_deleted, "success");
  } else {
    swal("Error", process.languages[process.settings.language].no_accounts_group_with_such_name, "error");
  }
};
const import_invite_steamids = () => {
  process.user_id_list = document.getElementById("idLoadArea").value.trim().split(/\r?\n| /).filter(_0x271cd7 => _0x271cd7 !== '');
  process.user_id_list_length = process.user_id_list.length;
  let _0x5d99bc = process.user_id_list_length;
  const _0x333993 = document.getElementById("invite_friends_blacklist");
  const _0xbc4cc = document.getElementById("use_invite_blacklist").checked;
  _0x333993.value.trim().split(/\r?\n| /).forEach(_0x29a88e => {
    if (_0x29a88e !== '') {
      process.invite_blacklist.add(_0x29a88e);
    }
  });
  if (_0xbc4cc) {
    process.user_id_list = process.user_id_list.filter(_0x3a7ea3 => !process.invite_blacklist.has(_0x3a7ea3));
  }
  _0x5d99bc -= process.user_id_list.length;
  process.storage.saveFile("id_for_invite.txt", process.user_id_list.join("\n"));
  process.storage.saveFile("invite_blacklist.txt", Array.from(process.invite_blacklist).join("\n"));
  _0x333993.value = '';
  document.getElementById("idLoadArea").value = process.user_id_list.join("\n");
  if (process.user_id_list_length > 0x0) {
    swal('Success', '' + process.helper.replace_log_variable(process.languages[process.settings.language].steamid_loaded, ['' + process.user_id_list.length, '' + _0x5d99bc]), "success");
  } else {
    swal("Error", process.languages[process.settings.language].enter_steamids_before_import, 'error');
  }
};
const import_wall_spam_steamids = () => {
  const _0x375bac = document.getElementById("use_wall_spam_blacklist").checked;
  process.wall_spam_id_list = document.getElementById("wall_spam_id").value.trim().split(/\r?\n| /).filter(_0x13b5a2 => _0x13b5a2 !== '');
  process.wall_spam_id_list_length = process.wall_spam_id_list.length;
  let _0x354129 = process.wall_spam_id_list.length;
  if (_0x375bac) {
    process.wall_spam_id_list = process.wall_spam_id_list.filter(_0x2c0fdc => !process.wall_spam_blacklist[_0x2c0fdc]);
  }
  _0x354129 -= process.wall_spam_id_list.length;
  process.storage.saveFile('wall_spam_id.txt', process.wall_spam_id_list.join("\n"));
  document.getElementById("wall_spam_id").value = process.wall_spam_id_list.join("\n");
  if (process.wall_spam_id_list.length > 0x0) {
    swal('Success', '' + process.helper.replace_log_variable(process.languages[process.settings.language].steamid_loaded, ['' + process.wall_spam_id_list.length, '' + _0x354129]), 'success');
  } else {
    swal("Error", process.languages[process.settings.language].enter_steamids_before_import, "error");
  }
};
const change_privacy = _0x567369 => {
  const _0x134c2a = Number(document.getElementById("profile_privacy").value);
  const _0x16d6fd = Number(document.getElementById("comments_privacy").value);
  const _0x53bfcb = Number(document.getElementById("inventory_privacy").value);
  const _0x114d79 = document.getElementById('inventory_gifts_privacy').checked;
  const _0x1cfa38 = Number(document.getElementById("game_details_privacy").value);
  const _0xd3cbb8 = document.getElementById("playtime_privacy").checked;
  const _0x541c85 = Number(document.getElementById("friend_list_privacy").value);
  const _0x1620e5 = _0x567369.length;
  const _0x597a86 = {
    'profile': _0x134c2a,
    'comments': _0x16d6fd,
    'inventory': _0x53bfcb,
    'inventoryGifts': _0x114d79,
    'gameDetails': _0x1cfa38,
    'playtime': _0xd3cbb8,
    'friendsList': _0x541c85
  };
  _0x567369.forEach((_0x15b9c8, _0x3545e8) => {
    const _0x383230 = setTimeout(() => {
      process.clients[_0x15b9c8].change_privacy(_0x597a86, {
        'index': _0x3545e8,
        'selected_accounts_length': _0x1620e5
      });
      delete process.action_timeouts.change_privacy[_0x383230];
    }, profile_change_timeout * _0x3545e8);
    process.action_timeouts.change_privacy[_0x383230] = 0x1;
  });
  swal("Success", process.languages[process.settings.language].start_changing_privacy, "success");
};
const change_profile = _0x150c4c => {
  const _0x18c097 = document.getElementById("profile_settings_name").value.trim();
  const _0x22a7d1 = document.getElementById('profile_settings_realName').value.trim();
  const _0x5706b7 = document.getElementById("profile_settings_summary").value.trim();
  const _0x1f50a1 = document.getElementById("profile_settings_country").value.trim();
  process.profile_settings = {
    'name': _0x18c097,
    'realName': _0x22a7d1,
    'summary': _0x5706b7,
    'country': _0x1f50a1
  };
  localStorage.setItem("profile_settings", JSON.stringify(process.profile_settings));
  const _0xfafb6e = _0x150c4c.length;
  _0x150c4c.forEach((_0x1a8445, _0x257593) => {
    const _0x4b72f1 = setTimeout(() => {
      process.clients[_0x1a8445].change_profile({
        'index': _0x257593,
        'selected_accounts_length': _0xfafb6e
      });
      delete process.action_timeouts.change_profile[_0x4b72f1];
    }, profile_change_timeout * _0x257593);
    process.action_timeouts.change_profile[_0x4b72f1] = 0x1;
  });
  swal("Success", process.languages[process.settings.language].start_changing_profile, "success");
};
const change_avatar = _0x5e3437 => {
  const _0x3d640f = document.getElementById("avatar_settings").value.trim();
  const _0x28222b = document.getElementById("avatar_change_timeout").value.trim();
  const _0x56d9a4 = Number(_0x28222b) * 0x3e8 || avatar_change_timeout;
  const _0x22b78f = _0x5e3437.length;
  if (_0x3d640f) {
    _0x5e3437.forEach((_0x363359, _0x3d0c5e) => {
      const _0x284b9e = setTimeout(() => {
        process.clients[_0x363359].change_avatar({
          'index': _0x3d0c5e,
          'selected_accounts_length': _0x22b78f
        });
        delete process.action_timeouts.change_avatar[_0x284b9e];
      }, _0x3d0c5e * _0x56d9a4);
      process.action_timeouts.change_avatar[_0x284b9e] = 0x1;
    });
    localStorage.setItem("avatar_settings", _0x3d640f);
    swal('Success', process.languages[process.settings.language].start_changing_avatar, "success");
  } else {
    swal("Error", process.languages[process.settings.language].import_image_links, "error");
  }
};
const steam_guard = _0x27c784 => {
  const _0x5802e9 = document.getElementById('codeInput').value.trim();
  if (_0x5802e9 === '') {
    swal("Error", process.languages[process.settings.language].input_steam_guard, "error");
  } else {
    _0x27c784(_0x5802e9);
  }
};
const render_customize_settings = () => {
  const _0x549940 = document.getElementById("customize");
  const _0x2f434 = document.querySelector(".user_actions_list").children;
  for (let _0x5b3bb2 = 0x0; _0x5b3bb2 < _0x2f434.length; _0x5b3bb2++) {
    if (_0x2f434[_0x5b3bb2].id.search(/unmute_user|remove_deleted_friend_action|unblock|add_deleted_friend_action/i) === -0x1) {
      _0x549940.insertAdjacentHTML("beforeend", "\n      <div class=\"input_row\">\n        <span>" + _0x2f434[_0x5b3bb2].innerHTML + "</span>\n        <input id=\"" + _0x2f434[_0x5b3bb2].id + "_checkbox\" " + (!process.customize_settings[_0x2f434[_0x5b3bb2].id] ? "checked" : '') + " type=\"checkbox\">\n      </div>\n      ");
      if (process.customize_settings[_0x2f434[_0x5b3bb2].id]) {
        document.getElementById(_0x2f434[_0x5b3bb2].id).classList.add("hide");
      }
    }
  }
};
const remove_banned_account = _0x112b5f => {
  const _0x47cd58 = process.clients[_0x112b5f];
  if (_0x47cd58) {
    _0x47cd58.removeSteamHandlers();
    _0x47cd58.removeEventEmitterHandlers();
    clearInterval(_0x47cd58.reloginInterval);
    clearInterval(_0x47cd58.weblogonInterval);
    _0x47cd58.client.logOff();
    delete process.clients[_0x112b5f];
    document.querySelector(".row_header_" + _0x112b5f).parentNode.remove();
    document.getElementById('action_account_' + _0x112b5f).parentNode.remove();
    const _0x1d0111 = document.querySelector(".lastMessages").childNodes;
    for (let _0x5e855e = 0x0; _0x5e855e < _0x1d0111.length; _0x5e855e++) {
      const _0x47fcaa = _0x1d0111[_0x5e855e];
      if (_0x47fcaa.dataset && _0x47fcaa.dataset.account_login === _0x112b5f) {
        _0x47fcaa.remove();
      }
    }
  }
};
const show_statistic = _0x120d5a => {
  const _0x5964ca = process.clients[_0x120d5a];
  let _0x566132 = '';
  for (const _0x456853 in _0x5964ca.statistic) {
    if (_0x456853 !== 'month') {
      const _0x324f94 = _0x5964ca.statistic[_0x456853];
      _0x566132 += _0x456853 + ": " + process.languages[process.settings.language].added + ": " + _0x324f94.added + " | " + process.languages[process.settings.language].removed + ": " + _0x324f94.deleted + "\n";
    }
  }
  swal({
    'title': process.languages[process.settings.language].statistic_for_accout + " " + _0x120d5a,
    'text': _0x566132
  });
};
const unpin_all = async () => {
  const _0x2aaa38 = await swal({
    'text': process.languages[process.settings.language].unpin_all,
    'buttons': {
      'confirm': 'OK',
      'cancel': "Cancel"
    }
  });
  if (_0x2aaa38) {
    for (const _0x1dad73 in process.clients) {
      const _0x128999 = process.clients[_0x1dad73];
      for (const _0x3e042e in _0x128999.pinned) {
        _0x128999.unpin(_0x3e042e);
      }
    }
  }
};
const pinUsers = (_0x3ef166, _0x3f4a52) => {
  const _0x16cde1 = document.querySelectorAll(".pin_by_status_state:checked");
  if (_0x16cde1.length > 0x0) {
    const _0x452e1e = {};
    for (let _0x189a90 = 0x0; _0x189a90 < _0x16cde1.length; _0x189a90++) {
      _0x452e1e[_0x16cde1[_0x189a90].dataset.online_state] = true;
    }
    _0x3ef166.forEach(_0x12f7bc => {
      if (_0x3f4a52 === 'pin_by_online_state') {
        process.clients[_0x12f7bc].pin_by_online_state(_0x452e1e);
      }
      if (_0x3f4a52 === "pin_by_message_history") {
        process.clients[_0x12f7bc].pin_without_messages(_0x452e1e);
      }
      if (_0x3f4a52 === 'pin_by_unread_messages') {
        process.clients[_0x12f7bc].pin_by_unread_messages(_0x452e1e);
      }
    });
    return swal("Success", process.languages[process.settings.language].friends_with_selected_states_pinned, "success");
  }
  return swal("Error", process.languages[process.settings.language].choose_online_states, 'error');
};
const clear_name_history = async _0x412478 => {
  const _0x509eb0 = await swal({
    'text': process.languages[process.settings.language].clear_name_history,
    'buttons': {
      'confirm': "Clear",
      'cancel': "Cancel"
    }
  });
  if (_0x509eb0) {
    _0x412478.forEach(_0x50f8a8 => process.clients[_0x50f8a8].clear_name_history());
    swal("Success", process.languages[process.settings.language].clearing_name_history, "success");
  }
};
const print_full_day_statistic = () => {
  const _0x5ad133 = {};
  let _0x8d3939 = 0x0;
  for (const _0x3da011 in process.clients) {
    const _0x4223ec = process.clients[_0x3da011];
    for (const _0x14716d in _0x4223ec.myFriends) {
      if (_0x4223ec.myFriends[_0x14716d] == 0x3) {
        ++_0x8d3939;
      }
    }
    for (const _0x128c6a in _0x4223ec.statistic) {
      if (_0x128c6a !== "month") {
        const _0x4f9209 = _0x4223ec.statistic[_0x128c6a];
        if (_0x5ad133[_0x128c6a]) {
          _0x5ad133[_0x128c6a].added += _0x4f9209.added;
          _0x5ad133[_0x128c6a].deleted += _0x4f9209.deleted;
          _0x5ad133[_0x128c6a].invites_sent += _0x4f9209.invites_sent;
        } else {
          _0x5ad133[_0x128c6a] = {};
          _0x5ad133[_0x128c6a].added = _0x4f9209.added;
          _0x5ad133[_0x128c6a].deleted = _0x4f9209.deleted;
          _0x5ad133[_0x128c6a].invites_sent = _0x4f9209.invites_sent;
        }
      }
    }
  }
  if (Object.keys(_0x5ad133).length > 0x0) {
    print_info(process.languages[process.settings.language].statis_from_all_accounts);
    if (document.querySelector(".statistic")) {
      document.querySelector(".statistic").remove();
    }
    const _0x12f88d = document.createElement('ul');
    _0x12f88d.className = 'statistic';
    for (const _0x30db67 in _0x5ad133) {
      _0x12f88d.insertAdjacentHTML("beforeend", '<p>' + _0x30db67 + ": " + process.languages[process.settings.language].added + ": " + _0x5ad133[_0x30db67].added + " | " + process.languages[process.settings.language].removed + ": " + _0x5ad133[_0x30db67].deleted + " | " + process.languages[process.settings.language].invites_sent + ": " + _0x5ad133[_0x30db67].invites_sent + "</p>");
    }
    if (process.current_modal === "console") {
      document.getElementById("terminal").insertAdjacentElement('beforeend', _0x12f88d);
    }
    process.console_logs = process.console_logs.filter(_0x5b85db => _0x5b85db.className !== "statistic");
    process.console_logs.push({
      'node': _0x12f88d.cloneNode(true),
      'event': null
    });
  }
  print_info(process.languages[process.settings.language].number_friends_from_all_accounts + ": " + _0x8d3939);
};
const print_game_prices_settings = () => {
  const _0x3640c1 = document.getElementById('games_prices_settings');
  process.games.forEach(_0x29299c => {
    _0x3640c1.insertAdjacentHTML("beforeend", "\n      <div class=\"input_row\">\n        <span>" + process.app_ids[_0x29299c] + "</span>\n        <input class=\"game_price_checkbox\" data-appid=\"" + _0x29299c + "\" " + (process.selected_games.includes(Number(_0x29299c)) ? "checked" : '') + " type=\"checkbox\">\n      </div>\n    ");
  });
};
const community_tasks = _0x42c308 => {
  const _0x2f3ca0 = document.getElementById("friend_id_for_add").value.trim();
  localStorage.setItem("friend_id_for_add", _0x2f3ca0);
  _0x42c308.forEach((_0x42db8e, _0x1c906d) => setTimeout(() => process.clients[_0x42db8e].complete_tasks(), _0x1c906d * 0xdac));
  swal("Success", process.languages[process.settings.language].completing_community_tasks, 'success');
};
const check_friends_limit = async _0x3f52bb => {
  const _0x460040 = document.createElement('div');
  _0x460040.classList.add('friends_limit_area');
  const _0x432454 = [];
  let _0x3ef358 = '';
  _0x3f52bb.forEach(_0xec7ca8 => {
    const _0x1b98c3 = process.clients[_0xec7ca8];
    let _0x53ad2f = 0x0;
    if (_0x1b98c3.friends_limit) {
      for (const _0x368864 in _0x1b98c3.myFriends) {
        if (!_0x1b98c3.deleted_friends[_0x368864] && _0x1b98c3.myFriends[_0x368864] == 0x3 || _0x1b98c3.myFriends[_0x368864] == 0x4) {
          ++_0x53ad2f;
        }
      }
      const _0x337d26 = !!(_0x1b98c3.friends_limit - _0x53ad2f <= 0x1e);
      if (_0x337d26) {
        _0x432454.push(_0xec7ca8);
      }
      _0x3ef358 += "<p class=\"" + (_0x337d26 ? 'red' : '') + "\">" + _0xec7ca8 + ": " + _0x53ad2f + " / " + _0x1b98c3.friends_limit + "</p>";
    }
  });
  _0x460040.innerHTML = _0x3ef358;
  const _0x502cdf = {
    'title': process.languages[process.settings.language].friends_limit,
    'content': _0x460040,
    'buttons': {
      'cancel': 'OK'
    }
  };
  if (_0x432454.length > 0x0) {
    _0x502cdf.buttons = {
      'confirm': "Clear invites",
      'cancel': 'OK'
    };
  }
  const _0x42ef3 = await swal(_0x502cdf);
  if (_0x42ef3) {
    clear_invites(_0x432454);
  }
};
const clear_comments = async _0x4207b1 => {
  const _0x409c8a = document.createElement('input');
  const _0xe164c7 = localStorage.getItem('clear_comments_keywords');
  _0x409c8a.type = "text";
  _0x409c8a.className = 'swal-content__input';
  _0x409c8a.placeholder = "fake, bot, -rep";
  if (_0xe164c7) {
    _0x409c8a.value = _0xe164c7;
  }
  const _0x41b5b8 = await swal({
    'text': process.languages[process.settings.language].clear_comments,
    'content': _0x409c8a,
    'buttons': {
      'confirm': "Clear",
      'cancel': "Cancel"
    }
  });
  if (_0x41b5b8) {
    localStorage.setItem("clear_comments_keywords", _0x409c8a.value);
    const _0x1ab9ce = _0x409c8a.value.split(',').map(_0x226294 => _0x226294.trim().replace(/[!@#$%^&*()+=\-[\]\\';,./{}|":<>?~_]/g, "\\$&"));
    swal('Success', process.languages[process.settings.language].clear_comments_started, "success");
    const _0x31422b = fastq.promise(async _0x1278b5 => {
      await process.clients[_0x1278b5].clear_comments(_0x1ab9ce);
    }, 0x1f4);
    _0x4207b1.map(_0x173fd4 => _0x31422b.push(_0x173fd4));
    await _0x31422b.drained();
    process.helper.print_info(process.languages[process.settings.language].clear_comments_finished, "yellow");
  }
};
const join_group = async _0x269659 => {
  process.group_links = document.getElementById('group_links').value.trim().split(/\r?\n| /).filter(_0x4d0e37 => _0x4d0e37 !== '');
  process.group_links_length = process.group_links.length;
  localStorage.setItem("group_links", document.getElementById("group_links").value.trim());
  if (process.group_links_length > 0x0) {
    swal('Success', process.languages[process.settings.language].group_joiner_started, "success");
    const _0x2fda71 = fastq.promise(async _0x567311 => {
      await process.clients[_0x567311].join_group_cycle();
    }, 0x1f4);
    _0x269659.map(_0x554868 => _0x2fda71.push(_0x554868));
    await _0x2fda71.drained();
    process.helper.print_info(process.languages[process.settings.language].join_groups_finished, "yellow");
  } else {
    swal('Error', process.languages[process.settings.language].import_group_links, 'error');
  }
};
const set_account_name = async _0x598834 => {
  input = document.createElement('input');
  input.type = 'text';
  input.className = "swal-content__input";
  const _0x44cc43 = await swal({
    'text': process.languages[process.settings.language].enter_account_name,
    'content': input,
    'buttons': {
      'cancel': "Cancel",
      'confirm': 'OK'
    }
  });
  if (_0x44cc43) {
    process.clients[_0x598834].set_account_name(input.value);
  }
};
const replace_log_variable = (_0x3fb5b8, _0x51d8d6) => {
  _0x51d8d6.forEach(_0x26b2ca => {
    _0x3fb5b8 = _0x3fb5b8.replace(replacement_variable, _0x26b2ca);
  });
  return _0x3fb5b8;
};
const set_program_language = async () => {
  const _0x2fea0b = document.getElementById('program_language').value;
  const _0x424457 = await swal({
    'text': process.languages[process.settings.language].change_language,
    'buttons': {
      'confirm': "Change",
      'cancel': 'Cancel'
    }
  });
  if (_0x424457) {
    localStorage.setItem("language", _0x2fea0b);
    ipcRenderer.send("change_window", _0x2fea0b + '.html');
  }
};
const mute_all_friends = (_0x40f907, _0x5b0ac4 = 'mute') => {
  const _0xeef262 = process.clients[_0x40f907];
  for (const _0x2ed77b in _0xeef262.users) mute(_0x40f907, _0x2ed77b, _0x5b0ac4);
};
const stop_respam = (_0x492414, _0x5e6ad0) => {
  clearTimeout(_0x492414);
  switch (_0x5e6ad0) {
    case "respam":
      swal("Success", process.languages[process.settings.language].respam_off, "success");
      break;
    case 'reinvite':
      swal("Success", process.languages[process.settings.language].reinvite_off, "success");
      break;
    case "invite_time":
      swal("Success", process.languages[process.settings.language].invite_time_off, "success");
      break;
    default:
      swal("Success", process.languages[process.settings.language].function_stopped, 'success');
  }
};
const invite_group = async _0x4aec04 => {
  const _0xe814ab = document.getElementById("invite_group_steamid").value.trim();
  if (_0xe814ab) {
    localStorage.setItem("invite_group_steamid", _0xe814ab);
    swal("Success", process.languages[process.settings.language].invite_group_started, 'success');
    const _0x11fd3a = fastq.promise(async _0x2b01d2 => {
      await process.clients[_0x2b01d2].group_invite_cycle(_0xe814ab);
    }, 0x1f4);
    _0x4aec04.map(_0x2fadb2 => _0x11fd3a.push(_0x2fadb2));
    await _0x11fd3a.drained();
    process.helper.print_info(process.languages[process.settings.language].invite_group_stopped, "yellow");
  } else {
    swal("Error", process.languages[process.settings.language].provide_group_steamid, "error");
  }
};
const remove_locked_accounts = (_0x29ffd8, _0x1ad32d) => {
  const _0x735b3c = new Set();
  for (const _0x16f131 in process.clients) {
    const _0x475b01 = process.clients[_0x16f131];
    if (_0x29ffd8 && _0x475b01.locked || _0x1ad32d && _0x475b01.limited) {
      remove_banned_account(_0x16f131);
      _0x735b3c.add(_0x16f131);
    }
  }
  const _0x5b9019 = getAccountsFromLoadArea(true);
  const _0xc72741 = _0x5b9019.filter(({
    login: _0x27b26f
  }) => !_0x735b3c.has(_0x27b26f)).map(_0x182ad1 => getAccountString(_0x182ad1)).join("\n");
  document.getElementById("accountsLoadArea").value = _0xc72741;
  load_data("accountsLoadArea", "accounts", false);
};
const getInvites = (_0x3abab0, _0x5274c1) => {
  const _0x573147 = [];
  for (const _0x4eac1c in _0x3abab0.myFriends) {
    const _0x50feea = _0x3abab0.myFriends[_0x4eac1c];
    if (_0x5274c1.includes(_0x50feea)) {
      _0x573147.push({
        'userId': _0x4eac1c,
        'relationship': _0x50feea
      });
    }
  }
  return _0x573147;
};
const accept_invites = _0x42cde7 => {
  _0x42cde7.forEach(_0x3bb4e8 => {
    const _0x54034a = getInvites(process.clients[_0x3bb4e8], [0x2]);
    _0x54034a.forEach((_0x23790e, _0x2af7bd) => {
      setTimeout(() => {
        process.clients[_0x3bb4e8].accept_invite(_0x23790e.userId, "log");
      }, _0x2af7bd * 0x7d0);
    });
  });
  swal("Success", process.languages[process.settings.language].accept_invites_started, "success");
};
const clear_incoming_invites = _0x98c9f6 => {
  _0x98c9f6.forEach(_0x9f94b5 => {
    const _0x3fe91c = getInvites(process.clients[_0x9f94b5], [0x2]);
    _0x3fe91c.forEach((_0x37e930, _0x440389) => {
      setTimeout(() => {
        process.clients[_0x9f94b5].client.removeFriend(_0x37e930.userId);
      }, _0x440389 * 0x7d0);
    });
  });
  swal("Success", process.languages[process.settings.language].clear_incoming_invites_started, "success");
};
const create_invite_link = _0x14eb58 => {
  _0x14eb58.forEach((_0xa85b5b, _0x1c18ec) => {
    setTimeout(() => {
      process.clients[_0xa85b5b].create_invite_link();
    }, 0x12c * _0x1c18ec);
  });
  swal("Success", process.languages[process.settings.language].create_invite_links_started, 'success');
};
const suspend_and_resume = _0x200cd0 => {
  for (const _0x530c28 in process.clients) {
    const _0x3d5003 = process.clients[_0x530c28];
    _0x3d5003.set_persona_state(_0x200cd0 === "suspend" ? 0x3 : 0x1);
  }
};
const remove_friends_by_price = async _0x32d3e4 => {
  const _0xde3038 = {
    'min': Number(document.getElementById("remove_friends_by_price_min").value),
    'max': Number(document.getElementById("remove_friends_by_price_max").value),
    'appid': document.getElementById("remove_friends_by_price_appid").value,
    'selected_accounts': _0x32d3e4
  };
  if (_0xde3038.min >= 0x0 && _0xde3038.max > 0x0 && _0xde3038.appid.length !== 0x0) {
    localStorage.setItem("remove_friends_by_price_min", _0xde3038.min);
    localStorage.setItem("remove_friends_by_price_max", _0xde3038.max);
    localStorage.setItem("remove_friends_by_price_appid", _0xde3038.appid);
    swal("Success", process.languages[process.settings.language].remove_friends_started, 'success');
    if (process.use_proxy) {
      await remove_friends_by_price_with_proxy(_0xde3038);
    } else {
      await remove_friends_by_price_without_proxy(_0xde3038);
    }
    print_info(process.languages[process.settings.language].remove_friends_by_price_stopped, "yellow");
  } else {
    swal("Error", process.languages[process.settings.language].fill_all_fields, "error");
  }
};
const remove_friends_by_price_without_proxy = async (_0xc77c7f, _0x228bab = 0x0) => {
  const {
    selected_accounts: _0x407cb1
  } = _0xc77c7f;
  const _0x371301 = _0x407cb1[_0x228bab];
  await process.clients[_0x371301].remove_friends_by_price(_0xc77c7f);
  if (_0x228bab < _0x407cb1.length - 0x1) {
    return remove_friends_by_price_without_proxy(_0xc77c7f, _0x228bab + 0x1);
  }
};
const remove_friends_by_price_with_proxy = _0x5f0db3 => Promise.all(_0x5f0db3.selected_accounts.map(_0x1b9ee9 => process.clients[_0x1b9ee9].remove_friends_by_price(_0x5f0db3)));
const getApiKeys = async _0x2f4c12 => {
  swal('Success', process.languages[process.settings.language].get_api_keys_started, "success");
  const _0x1806a0 = [];
  const _0x49fc42 = _0x260372 => {
    return new Promise(_0x58b90a => {
      const _0xe0a183 = setTimeout(() => _0x58b90a(), 0x1388);
      const _0xaeff0f = process.clients[_0x260372];
      _0xaeff0f.community.getWebApiKey(_0x260372, (_0x42a81e, _0x21859b) => {
        clearTimeout(_0xe0a183);
        if (_0x21859b) {
          print_info(_0x21859b);
          _0x1806a0.push(_0x21859b);
        }
        if (_0x42a81e) {
          const _0x1e2536 = "getWebApiKey " + _0x260372 + " " + _0x42a81e;
          print_info(_0x1e2536, 'red');
          logger.error(_0x1e2536);
        }
        _0x58b90a();
      });
    });
  };
  for (let _0x2d8406 = 0x0; _0x2d8406 < _0x2f4c12.length; _0x2d8406++) {
    await _0x49fc42(_0x2f4c12[_0x2d8406]);
    await wait(0x2710);
  }
  const _0x216baa = _0x1806a0.filter(_0x34a6f1 => typeof _0x34a6f1 === "string");
  print_info("Api Keys:<br>" + _0x216baa.join('<br>'));
};
export const loadSteamPriceByAppId = async _0x528959 => {
  const _0xc54ddf = await getServerRequestForm({
    'appId': _0x528959
  });
  const _0x329812 = encryptServerRequestForm(_0xc54ddf);
  return new Promise(_0x1807bf => {
    request({
      'url': domain + "/loadSteamPrice",
      'method': "POST",
      'form': {
        'data': _0x329812
      },
      'rejectUnauthorized': false
    }, (_0x2873a8, _0x47dd8c) => {
      if (_0x2873a8) {
        return _0x1807bf({
          'status': false
        });
      }
      return _0x1807bf({
        'status': true,
        'response': _0x47dd8c
      });
    });
  });
};
export const getLatestApplicationVersion = () => {
  return new Promise(_0x2eafd9 => {
    request.get("https://github.com/Inomezi/test_auto_update/releases", (_0x4d0a02, _0xff5c4f) => {
      if (!_0x4d0a02) {
        const _0xe973e7 = cheerio.load(_0xff5c4f.body);
        const _0x43d103 = _0xff5c4f.body.match(/releases\/tag\/v(\d+\.\d+\.\d+)/);
        const _0x1bfa2c = _0xe973e7(".markdown-body").first().html();
        if (_0x43d103) {
          return _0x2eafd9({
            'version': _0x43d103[0x1],
            'description': _0x1bfa2c
          });
        }
        return _0x2eafd9({
          'version': "0.0.0",
          'description': _0x1bfa2c
        });
      }
    });
  });
};
const unblockFriends = _0x1f6037 => {
  swal("Success", "Friends unblocked", "success");
  _0x1f6037.forEach(_0x5aed97 => {});
};
const changePasswords = async _0x4dc986 => {
  const _0xa5667a = await swal({
    'text': "Are you sure want to change passwords ?",
    'buttons': {
      'confirm': 'OK',
      'cancel': "Cancel"
    }
  });
  if (!_0xa5667a) {
    return;
  }
  swal("Success", "Password change started", "success");
  const _0x5aa0cd = path.join(os.homedir(), "Desktop", "multichat-passwords-" + new Date() + ".txt");
  const _0x523de7 = document.getElementById("accounts_groups_select").value;
  const _0x5c4f0b = document.getElementById("actions_choose_account_groups").value;
  const _0x3a22b7 = _0x5c4f0b !== 'null' ? _0x5c4f0b : _0x523de7;
  let _0x5c2356 = getAccountsFromLoadArea(true);
  const _0x4b36e4 = async ({
    login: _0x35b073,
    retry: _0x2f835b
  }) => {
    if (_0x2f835b) {
      process.helper.print_info("Change password: " + _0x35b073 + " Retrying after error, wait 15 sec", "yellow");
      await wait(0x3a98);
    }
    const _0x40061e = process.clients[_0x35b073];
    if (_0x40061e.maFile) {
      const {
        status: _0x3cdfac,
        password: _0x12e192
      } = await _0x40061e.changePasswordsWithTimeout(_0x5aa0cd);
      if (_0x3cdfac) {
        process.helper.print_info("Change password: New credentials " + _0x35b073 + ':' + _0x12e192, "grn");
        remove_banned_account(_0x35b073);
        _0x5c2356 = _0x5c2356.map(_0x376c8b => {
          if (_0x376c8b.login === _0x35b073) {
            return {
              ..._0x376c8b,
              'password': _0x12e192
            };
          }
          return _0x376c8b;
        });
        document.getElementById("accountsLoadArea").value = _0x5c2356.map(_0x115b95 => getAccountString(_0x115b95)).join("\n");
        load_data("accountsLoadArea", "accounts", false);
        if (_0x3a22b7 !== "null") {
          process.account_groups[_0x3a22b7] = document.getElementById("accountsLoadArea").value;
          localStorage.setItem('account_groups', JSON.stringify(process.account_groups));
        }
      } else {
        process.helper.print_info("Change password: " + _0x35b073 + " something went wrong. New credentials " + _0x35b073 + ':' + _0x12e192, "red");
        throw new Error("Change password: " + _0x35b073 + " something went wrong. New credentials " + _0x35b073 + ':' + _0x12e192);
      }
    } else {
      process.helper.print_info("Change password: " + _0x35b073 + " skipped because no maFile");
    }
  };
  const _0x57a14a = fastq.promise(_0x4b36e4, 0x2);
  _0x4dc986.map((_0x45da6a, _0x123c19) => {
    _0x57a14a.push({
      'login': _0x45da6a,
      'index': _0x123c19
    })["catch"](() => _0x57a14a.push({
      'login': _0x45da6a,
      'index': _0x123c19,
      'retry': true
    }));
  });
  await _0x57a14a.drained();
  process.helper.print_info("All passwords changed. Data in import replaced");
};
export const appVersionToNumber = _0x2b377e => Number(('' + _0x2b377e).replace(/\./g, ''));
export const removeDuplicates = _0x4e6170 => {
  const _0x23b4e4 = {};
  _0x4e6170.forEach(_0x3be336 => {
    const _0x4ac67f = process.clients[_0x3be336];
    for (const _0x2f773b in _0x4ac67f.myFriends) {
      if (_0x4ac67f.myFriends[_0x2f773b] === 0x3) {
        if (_0x23b4e4[_0x2f773b]) {
          _0x23b4e4[_0x2f773b].push(_0x3be336);
        } else {
          _0x23b4e4[_0x2f773b] = [_0x3be336];
        }
      }
    }
  });
  for (const _0x84bfe3 in _0x23b4e4) {
    const _0x3b1efd = _0x23b4e4[_0x84bfe3];
    if (_0x3b1efd.length > 0x1) {
      _0x3b1efd.slice(0x1).forEach(_0x100e62 => {
        process.clients[_0x100e62].client.removeFriend(_0x84bfe3);
      });
    }
  }
};
const getUuid = async () => {
  const _0x373f4d = localStorage.getItem("uuid");
  if (_0x373f4d) {
    return _0x373f4d;
  }
  const _0x149ed6 = await machine_uuid();
  localStorage.setItem('uuid', _0x149ed6);
  return _0x149ed6;
};
const wait = async _0x263a53 => new Promise(_0x47a11f => setTimeout(_0x47a11f, _0x263a53));
const getOnlineStatesStatistic = () => {
  const _0x4447c5 = {
    [online_states["In-game"]]: 0x0,
    [online_states.Online]: 0x0,
    [online_states.Busy]: 0x0,
    [online_states.Away]: 0x0,
    [online_states.Snooze]: 0x0,
    [online_states.Offline]: 0x0
  };
  for (const _0x2713a4 in process.clients) {
    const _0x12662f = process.clients[_0x2713a4];
    Object.entries(_0x12662f.users).forEach(([_0x1a4694, _0x5cdb7a]) => {
      if (_0x12662f.myFriends[_0x1a4694] === 0x3) {
        _0x4447c5[_0x5cdb7a.persona_state] += 0x1;
      }
    });
  }
  return _0x4447c5;
};
export default {
  'random': random,
  'print_info': print_info,
  'swap_active_header_button': swap_active_header_button,
  'get_templates': get_templates,
  'close_modal': close_modal,
  'load_data': load_data,
  'save_settings': save_settings,
  'fast_login_accounts': fast_login_accounts,
  'login_accounts': login_accounts,
  'hide_offline': hide_offline,
  'choose_all_accounts_actions': choose_all_accounts_actions,
  'actions': actions,
  'choose_online_state_for_spam': choose_online_state_for_spam,
  'search_by_name': search_by_name,
  'hide_by_name': hide_by_name,
  'show_user_actions_list': show_user_actions_list,
  'provide_mafile_path': provide_mafile_path,
  'notificate': notificate,
  'get_offline_time': get_offline_time,
  'template_timeout': template_timeout,
  'add_accounts_group': add_accounts_group,
  'select_accounts_from_group': select_accounts_from_group,
  'remove_accounts_group': remove_accounts_group,
  'import_invite_steamids': import_invite_steamids,
  'read_mafiles': read_mafiles,
  'import_wall_spam_steamids': import_wall_spam_steamids,
  'steam_guard': steam_guard,
  'render_customize_settings': render_customize_settings,
  'open_link': open_link,
  'unpin_all': unpin_all,
  'save_localstorage': save_localstorage,
  'print_game_prices_settings': print_game_prices_settings,
  'pretty_time': pretty_time,
  'read_file': read_file,
  'replace_log_variable': replace_log_variable,
  'set_program_language': set_program_language,
  'mute': mute,
  'remove_banned_account': remove_banned_account,
  'pretty_date': pretty_date,
  'open_link_browser': open_link_browser,
  'accept_invites': accept_invites,
  'suspend_and_resume': suspend_and_resume,
  'remove_friends_by_price': remove_friends_by_price,
  'toggleUserVisibilityByOnlineState': toggleUserVisibilityByOnlineState,
  'getApiKeys': getApiKeys,
  'loadSteamPriceByAppId': loadSteamPriceByAppId,
  'getLatestApplicationVersion': getLatestApplicationVersion,
  'appVersionToNumber': appVersionToNumber,
  'replaceTemplateDomains': replaceTemplateDomains,
  'getDomainTemplates': getDomainTemplates,
  'getUuid': getUuid,
  'wait': wait,
  'getOnlineStatesStatistic': getOnlineStatesStatistic,
  'getInvites': getInvites
};