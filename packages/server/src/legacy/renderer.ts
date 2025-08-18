import {
    loadSteamPriceByAppId,
    getLatestApplicationVersion,
    appVersionToNumber
  } from "./components/helper";
  import {
    msInDay
  } from "./components/utils/common";
  const windows = !(process.platform === 'darwin');
  import Sortable from "./components/sortable";
  import {
    FindInPage
  } from 'electron-find';
  import appdirectory from "appdirectory";
  const data_directory = new appdirectory({
    'appName': 'steam-multichat',
    'appAuthor': 'ino'
  }).userData();
  import file_manager from "file-manager";
  import {
    ipcRenderer,
    clipboard
  } from 'electron';
  import remote from "@electron/remote";
  import {
    logger
  } from "./components/logger";
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
  const findInPage = new FindInPage(remote.getCurrentWebContents(), {
    'offsetTop': 0,
    'offsetRight': 115,
    'inputBgColor': "#fff",
    'boxShadowColor': "#000"
  });
  process.storage = new file_manager(data_directory);
  process.languages = import("./recourses/languages");
  process.fs = import('fs');
  process.player = document.getElementById("player_audio");
  process.clipboard = clipboard;
  process.steamid = import("steamid");
  process.wall_spam_errors = /You've been posting too frequently, and can't make another post right now|The settings on this account do not allow you to add comments|To post this comment, your account must have Steam Guard enabled|слишком часто|Настройки данного профиля не позволяют вам оставлять комментарии/i;
  RegExp.escape = _0xb64697 => _0xb64697.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  process.games = [730, 570, 440, 578080, 433850, 251210];
  process.prices = {};
  process.selected_games = JSON.parse(localStorage.getItem("selected_games")) || [730, 570];
process.app_ids = import("./recourses/app_id.js");
  process.multichat_version = import("./package.json").version;
  process.helper = import("./components/helper");
  process.accounts = [];
  process.proxy = [];
  process.console_logs = [];
  process.current_modal = null;
  process.open_chat = null;
  process.account_groups = {};
  process.action_timeouts = {
    'change_profile': {},
    'change_privacy': {},
    'change_avatar': {},
    'spam_all': {}
  };
  process.hiddenOnlineStates = JSON.parse(localStorage.getItem('hiddenOnlineStates')) || {
    'Offline': false,
    'Online': false,
    'In-game': false,
    'Away': false,
    'Busy': false,
    'Snooze': false,
    'LookingToTrade': false,
    'LookingToPlay': false
  };
  try {
    process.account_groups = JSON.parse(localStorage.getItem("account_groups")) || {};
  } catch (err: unknown) {
    process.account_groups = {};
  }
  process.profile_settings = JSON.parse(localStorage.getItem("profile_settings")) || {};
  process.customize_settings = JSON.parse(localStorage.getItem("customize_settings")) || {};
  process.invite_blacklist = new Set();
  process.wall_spam_blacklist = {};
  process['0x_287432'] = false;
  process.clients = {};
  process.maFiles = {};
  process.settings = {
    'auto_message_timeout': 10000,
    'invite_timeout': 3000,
    'wall_spam_message_timeout': 2000,
    'auto_template_timeout_milisec': 200,
    'friends_area_offset': 115,
    'invite_count': 30,
    'paste_template': false,
    'auto_pin_unread_messages': false,
    'get_user_info': true,
    'use_saved_data': true,
    'dont_remember_machine': false,
    'not_send_auto_message_for_new_friend_if_has_messages': false,
    'pin_top_on_new_message': false,
    'connection_procol': 0,
    'language': localStorage.getItem("language") ? localStorage.getItem("language") : 'ru',
    'dearest_item_language': "english",
    'pin_direction': "bottom"
  };
  process.use_proxy = false;
  process.close_update = false;
  const set_start_screen = () => {
    const _0x26567d = localStorage.getItem("use_proxy");
    if (_0x26567d) {
      const _0x578028 = JSON.parse(_0x26567d);
      const _0x4bc93b = _0x578028 ? "proxyLoad" : 'accountsLoad';
      process.helper.close_modal();
      process.helper.swap_active_header_button();
      document.getElementById(_0x4bc93b).classList.add("active");
      document.getElementById(_0x4bc93b + "Modal").style.display = "block";
    }
  };
  const user_key = localStorage.getItem('id');
  window.onload = () => {
    document.title = "Ino Multichat " + process.multichat_version;
    set_start_screen();
    const accounts = localStorage.getItem('accounts');
    const proxy = localStorage.getItem("proxy");
    const templates = localStorage.getItem("templates");
    const new_friend_spam_message = localStorage.getItem('new_friend_spam_message');
    const sound = localStorage.getItem("sound");
    const notification = localStorage.getItem("notification");
    const save_deleted_friends = localStorage.getItem("save_deleted_friends");
    const auto_message_for_new_friend = localStorage.getItem("auto_message_for_new_friend");
    const auto_message_timeout = localStorage.getItem("auto_message_timeout");
    const auto_template_timeout = localStorage.getItem('auto_template_timeout');
    const auto_boost = localStorage.getItem("auto_boost");
    const last_invite = localStorage.getItem("last_invite");
    const spam_all_message = localStorage.getItem("spam_all_message");
    const id_for_invite = localStorage.getItem('id_for_invite');
    const wall_spam_id = localStorage.getItem('wall_spam_id');
    const wall_spam_message = localStorage.getItem("wall_spam_message");
    const last_wall_spam = localStorage.getItem("last_wall_spam");
    const use_invite_blacklist = localStorage.getItem("use_invite_blacklist");
    const use_wall_spam_blacklist = localStorage.getItem('use_wall_spam_blacklist');
    const customize = localStorage.getItem("customize");
    const modal_background_color = localStorage.getItem("modal_background_color");
    const chat_background_color = localStorage.getItem('chat_background_color');
    const account_name_color = localStorage.getItem("account_name_color");
    const open_chat_color = localStorage.getItem('open_chat_color');
    const deleted_friend_background = localStorage.getItem("deleted_friend_background");
    const auto_template_timeout_milisec = localStorage.getItem('auto_template_timeout_milisec');
    const games_for_boost = localStorage.getItem('games_for_boost');
    const avatar_settings = localStorage.getItem("avatar_settings");
    const last_price_checked = localStorage.getItem("last_price_checked");
    const paste_template = localStorage.getItem('paste_template');
    const auto_pin_unread_messages = localStorage.getItem("auto_pin_unread_messages");
    const delete_duplicates = localStorage.getItem('delete_duplicates');
    const auto_install_update = localStorage.getItem("auto_install_update");
    const wall_spam_message_timeout = localStorage.getItem("wall_spam_message_timeout");
    const template_domain = localStorage.getItem('template_domain');
    const hideFriend = localStorage.getItem('hideFriend');
    const friend_id_for_add = localStorage.getItem("friend_id_for_add");
    const get_user_info = localStorage.getItem('get_user_info');
    const volume = localStorage.getItem("volume");
    const use_saved_data = localStorage.getItem('use_saved_data');
    const friends_add_comment = localStorage.getItem("friends_add_comment");
    const dont_remember_machine = localStorage.getItem('dont_remember_machine');
    const selected_online_state = localStorage.getItem("selected_online_state");
    const invite_count = localStorage.getItem('invite_count');
    const group_links = localStorage.getItem("group_links");
    const fast_auth = localStorage.getItem("fast_auth");
    const invite_group_steamid = localStorage.getItem("invite_group_steamid");
    const auto_remove_locked_accounts = localStorage.getItem("auto_remove_locked_accounts");
    const auto_remove_limited_accounts = localStorage.getItem('auto_remove_limited_accounts');
    const connection_procol = localStorage.getItem("connection_procol");
    const dearest_item_language = localStorage.getItem("dearest_item_language");
    const pin_direction = localStorage.getItem("pin_direction");
    const not_send_auto_message_for_new_friend_if_has_messages = localStorage.getItem("not_send_auto_message_for_new_friend_if_has_messages");
    const remove_friends_by_price_min = localStorage.getItem("remove_friends_by_price_min");
    const remove_friends_by_price_max = localStorage.getItem('remove_friends_by_price_max');
    const remove_friends_by_price_appid = localStorage.getItem("remove_friends_by_price_appid");
    const pin_top_on_new_message = localStorage.getItem("pin_top_on_new_message");
 
    process.player.volume = Number(volume) || 1;
    document.getElementById("volume").value = process.player.volume;
    document.getElementById("accountsLoadArea").placeholder = "login:password\nlogin:password - proxy\nlogin:password:::shared_secret:::identity_secret\nlogin:password:::shared_secret:::identity_secret - proxy";
    document.getElementById("proxyLoadArea").placeholder = "ip:port:login:password\nip:port";
    if (accounts) {
      document.getElementById('accountsLoadArea').value = accounts;
    }
    if (proxy) {
      document.getElementById("proxyLoadArea").value = proxy;
    }
    if (templates) {
      document.getElementById("templates").value = templates;
    }
    if (new_friend_spam_message) {
      document.getElementById('new_friend_spam_message').value = new_friend_spam_message;
      process.settings.new_friend_spam_message = new_friend_spam_message;
    }
    if (sound) {
      const _0xa86ee6 = JSON.parse(sound);
      document.getElementById('sound').checked = _0xa86ee6;
      process.settings.sound = _0xa86ee6;
    }
    if (notification) {
      const _0x54feca = JSON.parse(notification);
      document.getElementById("notification").checked = _0x54feca;
      process.settings.notification = _0x54feca;
    }
    if (save_deleted_friends) {
      const _0xd3042f = JSON.parse(save_deleted_friends);
      document.getElementById("save_deleted_friends").checked = _0xd3042f;
      process.settings.save_deleted_friends = _0xd3042f;
    }
    if (auto_message_for_new_friend) {
      const _0x18a087 = JSON.parse(auto_message_for_new_friend);
      document.getElementById('auto_message_for_new_friend').checked = _0x18a087;
      process.settings.auto_message_for_new_friend = _0x18a087;
    }
    if (last_invite) {
      document.getElementById("last_invite").innerText = last_invite;
    }
    if (spam_all_message) {
      document.getElementById('spam_all_message').innerText = spam_all_message;
      process.settings.spam_all_message = spam_all_message;
    }
    if (id_for_invite) {
      document.getElementById("idLoadArea").value = id_for_invite;
      process.storage.saveFile("id_for_invite.txt", id_for_invite).then(_0xbaa537 => {
        localStorage.removeItem("id_for_invite");
      });
    }
    if (wall_spam_id) {
      document.getElementById("wall_spam_id").value = wall_spam_id;
      process.storage.saveFile("wall_spam_id.txt", wall_spam_id).then(_0x367e59 => {
        localStorage.removeItem("wall_spam_id");
      });
    }
    if (wall_spam_message) {
      document.getElementById("wall_spam_message").value = wall_spam_message;
    }
    if (last_wall_spam) {
      document.getElementById("last_wall_spam").innerText = last_wall_spam;
    }
    if (auto_message_timeout) {
      document.getElementById("auto_message_timeout").value = auto_message_timeout;
      process.settings.auto_message_timeout = Number(auto_message_timeout) * 1000;
    } else {
      document.getElementById("auto_message_timeout").value = process.settings.auto_message_timeout / 1000;
    }
    if (auto_template_timeout) {
      const _0x24ae2b = JSON.parse(auto_template_timeout);
      document.getElementById("auto_template_timeout").checked = _0x24ae2b;
      process.settings.auto_template_timeout = _0x24ae2b;
    }
    if (auto_boost) {
      const _0xba2276 = JSON.parse(auto_boost);
      document.getElementById('auto_boost').checked = _0xba2276;
      process.settings.auto_boost = _0xba2276;
    }
    if (customize) {
      document.getElementById("my_style").innerHTML = customize;
    }
    if (modal_background_color) {
      document.getElementById("modal_background_color").value = modal_background_color;
    }
    if (chat_background_color) {
      document.getElementById("chat_background_color").value = chat_background_color;
    }
    if (account_name_color) {
      document.getElementById("account_name_color").value = account_name_color;
    }
    if (open_chat_color) {
      document.getElementById("open_chat_color").value = open_chat_color;
    }
    if (deleted_friend_background) {
      document.getElementById("deleted_friend_background").value = deleted_friend_background;
    }
    if (auto_template_timeout_milisec) {
      document.getElementById("auto_template_timeout_milisec").value = auto_template_timeout_milisec;
      process.settings.auto_template_timeout_milisec = auto_template_timeout_milisec;
    } else {
      document.getElementById("auto_template_timeout_milisec").value = process.settings.auto_template_timeout_milisec;
    }
    if (games_for_boost) {
      document.getElementById('games_for_boost').value = games_for_boost;
    }
    if (avatar_settings) {
      document.getElementById('avatar_settings').value = avatar_settings;
    }
    for (const _0xafc9b7 in process.profile_settings) {
      const _0xa4348a = document.getElementById(`profile_settings_${_0xafc9b7}`);
      if (_0xa4348a) {
        _0xa4348a.value = process.profile_settings[_0xafc9b7];
      }
    }
    if (paste_template) {
      const _0x51cee2 = JSON.parse(paste_template);
      document.getElementById("paste_template").checked = _0x51cee2;
      process.settings.paste_template = _0x51cee2;
    }
    if (use_invite_blacklist) {
      const _0xaf7b6c = JSON.parse(use_invite_blacklist);
      document.getElementById("use_invite_blacklist").checked = _0xaf7b6c;
    }
    if (use_wall_spam_blacklist) {
      const _0xaddc4a = JSON.parse(use_wall_spam_blacklist);
      document.getElementById("use_wall_spam_blacklist").checked = _0xaddc4a;
    }
    if (auto_pin_unread_messages) {
      const _0x1037bf = JSON.parse(auto_pin_unread_messages);
      document.getElementById("auto_pin_unread_messages").checked = _0x1037bf;
      process.settings.auto_pin_unread_messages = _0x1037bf;
    }
    if (delete_duplicates) {
      const _0x1b0b4b = JSON.parse(delete_duplicates);
      document.getElementById("delete_duplicates").checked = _0x1b0b4b;
    }
    if (auto_install_update) {
      const _0x439e61 = JSON.parse(auto_install_update);
      document.getElementById("auto_install_update").checked = _0x439e61;
    }
    if (wall_spam_message_timeout) {
      document.getElementById('wall_spam_message_timeout').value = wall_spam_message_timeout;
      process.settings.wall_spam_message_timeout = Number(wall_spam_message_timeout) * 1000;
    }
    if (template_domain) {
      document.getElementById("template_domain").value = template_domain;
      process.settings.template_domain = template_domain;
    }
    if (hideFriend) {
      document.getElementById("hideFriend").value = hideFriend;
    }
    if (friend_id_for_add) {
      document.getElementById("friend_id_for_add").value = friend_id_for_add;
    }
        if (get_user_info) {
      get_user_info_parsed = JSON.parse(get_user_info);
      document.getElementById('get_user_info').checked = get_user_info_parsed;
      process.settings.get_user_info = get_user_info_parsed;
    } else {
      document.getElementById("get_user_info").checked = true;
    }
    if (use_saved_data) {
      const _0x3ce89f = JSON.parse(use_saved_data);
      process.settings.use_saved_data = _0x3ce89f;
      document.getElementById("use_saved_data").checked = _0x3ce89f;
    } else {
      document.getElementById('use_saved_data').checked = true;
    }
    if (friends_add_comment) {
      document.getElementById("friends_add_comment").value = friends_add_comment;
      process.settings.friends_add_comment = friends_add_comment;
    }
    if (invite_count) {
      document.getElementById("invite_count").value = invite_count;
      process.settings.invite_count = invite_count;
    }
    if (dont_remember_machine) {
      const _0x589631 = JSON.parse(dont_remember_machine);
      process.settings.dont_remember_machine = _0x589631;
      document.getElementById("dont_remember_machine").checked = _0x589631;
    } else {
      document.getElementById("dont_remember_machine").checked = false;
      process.settings.dont_remember_machine = false;
    }
    if (selected_online_state) {
      document.getElementById("setStateAll").value = selected_online_state;
    }
    if (group_links) {
      document.getElementById("group_links").value = group_links;
    }
    if (fast_auth) {
      const _0x43275e = JSON.parse(fast_auth);
      document.getElementById("fast_auth").checked = _0x43275e;
    } else {
      document.getElementById("fast_auth").checked = true;
    }
    if (invite_group_steamid) {
      document.getElementById("invite_group_steamid").value = invite_group_steamid;
    }
    if (auto_remove_locked_accounts) {
      const _0x1475f8 = JSON.parse(auto_remove_locked_accounts);
      document.getElementById("auto_remove_locked_accounts").checked = _0x1475f8;
    }
    if (auto_remove_limited_accounts) {
      const _0x3d7c79 = JSON.parse(auto_remove_limited_accounts);
      document.getElementById("auto_remove_limited_accounts").checked = _0x3d7c79;
    }
    if (connection_procol) {
      document.getElementById("connection_procol").value = connection_procol;
      process.settings.connection_procol = Number(connection_procol);
    }
    if (dearest_item_language) {
      document.getElementById("dearest_item_language").value = dearest_item_language;
      process.settings.dearest_item_language = dearest_item_language;
    }
    if (pin_direction) {
      document.getElementById('pin_direction').value = pin_direction;
      process.settings.pin_direction = pin_direction;
    }
    if (not_send_auto_message_for_new_friend_if_has_messages) {
      const _0x15678c = JSON.parse(not_send_auto_message_for_new_friend_if_has_messages);
      document.getElementById("not_send_auto_message_for_new_friend_if_has_messages").checked = _0x15678c;
      process.settings.not_send_auto_message_for_new_friend_if_has_messages = _0x15678c;
    }
    if (remove_friends_by_price_min) {
      document.getElementById('remove_friends_by_price_min').value = remove_friends_by_price_min;
    }
    if (remove_friends_by_price_max) {
      document.getElementById("remove_friends_by_price_max").value = remove_friends_by_price_max;
    }
    if (remove_friends_by_price_appid) {
      document.getElementById('remove_friends_by_price_appid').value = remove_friends_by_price_appid;
    }
    if (pin_top_on_new_message) {
      const _0x4dcbba = JSON.parse(pin_top_on_new_message);
      document.getElementById('pin_top_on_new_message').checked = _0x4dcbba;
      process.settings.pin_top_on_new_message = _0x4dcbba;
    }
    document.getElementById("accounts_groups_select").onchange = () => process.helper.select_accounts_from_group();
    if (Object.keys(process.account_groups).length > 0) {
      const accountsGroupsSelect = document.getElementById('accounts_groups_select');
      const actionsChooseAccountGroups = document.getElementById("actions_choose_account_groups");
      const friendsChooseAccountGroups = document.getElementById("friends_choose_account_groups");
      for (const accountGroup in process.account_groups) {
        accountsGroupsSelect.insertAdjacentHTML("beforeend", `<option value="${accountGroup}" id="accounts_group_${accountGroup}">${accountGroup}</option>`);
        actionsChooseAccountGroups.insertAdjacentHTML("beforeend", `<option value="${accountGroup}" id="actions_choose_account_groups_${accountGroup}">${accountGroup}</option>`);
        friendsChooseAccountGroups.insertAdjacentHTML("beforeend", `<option value="${accountGroup}" id="friends_choose_account_groups_${accountGroup}">${accountGroup}</option>`);
      }
    }
    document.getElementById("actions_choose_account_groups").onchange = (event: Event) => {
      const target = event.currentTarget as HTMLSelectElement;
      const selectedValue = target.value;
      const actionCheckboxes = document.querySelectorAll(".action_checkbox");
      const lastInvite = localStorage.getItem(`last_invite_${selectedValue}`);
      if (lastInvite) {
        document.getElementById("last_invite").innerText = `${selectedValue} ${lastInvite}`;
      } else if (lastInvite) {
        document.getElementById('last_invite').innerText = lastInvite;
      }
      for (let i = 0; i < actionCheckboxes.length; i++) {
        (actionCheckboxes[i] as HTMLInputElement).checked = false;
      }
      try {} catch (err: unknown) {}
    };
    document.getElementById("friends_choose_account_groups").onchange = (event: Event) => {
      const target = event.currentTarget as HTMLSelectElement;
      const selectedValue = target.value;
      const rows = document.querySelectorAll('.row');
      rows.forEach(row => selectedValue === "null" ? row.classList.remove("hide") : row.classList.add("hide"));
      if (selectedValue === 'null') {
        return;
      }
      try {} catch (err: unknown) {}
    };
    ["console", "accountsLoad", "proxyLoad", "settings", "actions", 'friends', 'faq'].forEach(tabId => {
      document.getElementById(tabId).addEventListener("click", (event: Event) => {
        process.helper.close_modal();
        process.helper.swap_active_header_button();
        (event.currentTarget as HTMLElement).classList.add('active');
            const terminal = document.getElementById("terminal");
        const statistic = document.querySelector(".statistic");
        document.querySelectorAll(".console p").forEach(p => {
          if (p.id !== "inoSearcherLink") {
            p.remove();
          }
        });
        if (statistic) {
          statistic.remove();
        }
        process.current_modal = tabId;
        if (tabId !== 'console') {
          document.getElementById(tabId + "Modal").style.display = "block";
        } else {
          process.console_logs.forEach(log => {
            const logNode = document.importNode(log.node, true);
            if (log.event) {
              logNode.onclick = () => process.helper.open_link_browser(log.event.login, log.event.link);
            }
            terminal.appendChild(logNode);
          });
          terminal.scrollTop = terminal.scrollHeight;
        }
      });
    });
    ['inviter', "spam", 'hourboost', "setstates", 'wall_spam', "accounts_group", "edit_profile", "pin_by_status", 'community_task', "group_joiner", "remove_friends_by_price"].forEach(actionId => {
      document.getElementById(actionId).addEventListener("click", () => {
        process.helper.close_modal();
        document.getElementById(actionId + "Modal").style.display = 'block';
      });
    });
    document.getElementById("import_accounts").addEventListener("click", () => {
      process.accounts = process.helper.load_data('accountsLoadArea', 'accounts');
    });
    document.getElementById('import_proxy').addEventListener("click", () => {
      process.proxy = process.helper.load_data("proxyLoadArea", "proxy");
      ipcRenderer.send("import_proxy", process.proxy[0x0]);
    });
    document.getElementById("settings_save").addEventListener("click", () => {
      process.helper.save_settings();
    });
    document.getElementById('clear_settings').onclick = async () => {
      const clearSettings = await swal({
        'text': process.languages[process.settings.language].clear_settings,
        'buttons': {
          'confirm': 'Clear',
          'cancel': "Cancel"
        }
      });
      if (clearSettings) {
        localStorage.clear();
        localStorage.setItem('id', user_key);
        location.reload();
      }
    };
    document.getElementById('login_accounts').addEventListener("click", async () => {
      const useProxy = () => {
        const accountsWithProxy = process.accounts.filter(account => account.proxy !== undefined);
        return accountsWithProxy.length !== 0 || process.proxy.length !== 0;
      };
      if (process.accounts.length > 0x0) {
        await process.helper.read_mafiles();
        process.use_proxy = useProxy();
        const maFilesCount = Object.keys(process.maFiles).length;
        if (document.getElementById("fast_auth").checked && (maFilesCount === 0 || maFilesCount === 1 && process.maFiles['1'] !== undefined)) {
          process.helper.print_info(process.languages[process.settings.language].fast_auth_no_mafiles, "yellow");
        } else {
          process.helper.print_info(`Loaded ${maFilesCount} MaFiles`);
        }
        process.helper.print_info(process.languages[process.settings.language].start_auth + " " + (process.use_proxy ? '' + process.languages[process.settings.language].with_proxy : '' + process.languages[process.settings.language].without_proxy));
        const selectedValue = document.getElementById("accounts_groups_select").value;
        const lastInvite = localStorage.getItem(`last_invite_${selectedValue}`);
        if (lastInvite) {
          process.helper.print_info(process.languages[process.settings.language].last_friend_invite + " " + selectedValue + ": " + lastInvite);
        } else {
          if (lastInvite) {
            process.helper.print_info(process.languages[process.settings.language].last_friend_invite + ": " + lastInvite);
          }
        }
        const useSavedData = document.getElementById("use_saved_data").checked;
        const dontRememberMachine = document.getElementById('dont_remember_machine').checked;
        const fastAuth = document.getElementById('fast_auth').checked;
        const autoRemoveLockedAccounts = document.getElementById("auto_remove_locked_accounts").checked;
        const autoRemoveLimitedAccounts = document.getElementById("auto_remove_limited_accounts").checked;
        const connectionProcol = Number(document.getElementById('connection_procol').value);
        process.settings.dont_remember_machine = dontRememberMachine;
        process.settings.use_saved_data = useSavedData;
        process.settings.connection_procol = connectionProcol;
        localStorage.setItem('use_saved_data', useSavedData);
        localStorage.setItem("dont_remember_machine", dontRememberMachine);
        localStorage.setItem('fast_auth', fastAuth);
        localStorage.setItem('use_proxy', process.use_proxy);
        localStorage.setItem('auto_remove_locked_accounts', autoRemoveLockedAccounts);
        localStorage.setItem('auto_remove_limited_accounts', autoRemoveLimitedAccounts);
        localStorage.setItem('connection_procol', connectionProcol);
        process.current_account_index = 1;
          if (fastAuth) {
          process.helper.fast_login_accounts();
        } else {
          process.helper.login_accounts();
        }
        document.getElementById("console").click();
      } else {
        swal("Error", process.languages[process.settings.language].import_accounts_before, "error");
      }
    });
    const hideByOnlineState = document.querySelectorAll('.hideByOnlineState');
    for (let i = 0; i < hideByOnlineState.length; i++) {
      const hideByOnlineStateItem = hideByOnlineState[i];
      hideByOnlineStateItem.checked = process.hiddenOnlineStates[hideByOnlineStateItem.dataset.onlinestate];
      hideByOnlineStateItem.addEventListener("click", (event: Event) => {
        const target = event.currentTarget as HTMLInputElement;
        const onlineState = target.dataset.onlinestate;
        process.hiddenOnlineStates[onlineState] = target.checked;
        process.helper.toggleUserVisibilityByOnlineState(onlineState, target.checked);
        localStorage.setItem("hiddenOnlineStates", JSON.stringify(process.hiddenOnlineStates));
      });
    }
    document.getElementById("choose_all_accounts_actions").addEventListener("click", (event: Event) => {
      process.helper.choose_all_accounts_actions(event);
    });
    document.getElementById("set_online_state").addEventListener("click", () => {
      process.helper.actions({
        'action_name': 'set_online_state'
      });
    });
    document.getElementById("start_boost").addEventListener("click", () => {
      process.helper.actions({
        'action_name': "play_game",
        'is_play': true
      });
    });
    document.getElementById('stop_boost').addEventListener("click", () => {
      process.helper.actions({
        'action_name': "play_game",
        'is_play': false
      });
    });
    document.getElementById("clear_invites").addEventListener("click", () => {
      process.helper.actions({
        'action_name': 'clear_invites'
      });
    });
    document.getElementById("clear_friends").addEventListener("click", () => {
      process.helper.actions({
        'action_name': "clear_friends"
      });
    });
    document.querySelector(".spam_online_state.all").addEventListener("click", (event: Event) => {
      process.helper.choose_online_state_for_spam(event, 'spam_online_state');
    });
    document.querySelector('.pin_by_status_state.all').addEventListener("click", (event: Event) => {
      process.helper.choose_online_state_for_spam(event, 'pin_by_status_state');
    });
    document.getElementById("spam_all").addEventListener("click", () => {
      process.helper.actions({
        'action_name': "spam_all"
      });
    });
    document.getElementById("spam_pinned").onclick = () => process.helper.actions({
      'action_name': "spam_pinned"
    });
    document.getElementById("invite_friends").addEventListener('click', () => {
      process.helper.actions({
        'action_name': 'invite_friends'
      });
    });
    document.getElementById('start_wall_spam').addEventListener("click", () => {
      process.helper.actions({
        'action_name': 'wall_spam'
      });
    });
    document.getElementById('hold_deleter').addEventListener('click', () => {
      process.helper.actions({
        'action_name': "hold_deleter"
      });
    });
    document.getElementById("change_privacy").addEventListener("click", () => process.helper.actions({
      'action_name': 'change_privacy'
    }));
    document.getElementById("change_profile").addEventListener('click', () => process.helper.actions({
      'action_name': 'change_profile'
    }));
    document.getElementById("change_avatar").addEventListener("click", () => process.helper.actions({
      'action_name': "change_avatar"
    }));
    document.getElementById("set_ui_mode").addEventListener("click", () => process.helper.actions({
      'action_name': 'set_ui_mode'
    }));
    document.getElementById("pin_by_online_state").addEventListener("click", () => process.helper.actions({
      'action_name': 'pin_by_online_state'
    }));
    document.getElementById("pin_by_unread_messages").addEventListener("click", () => process.helper.actions({
      'action_name': 'pin_by_unread_messages'
    }));
    document.getElementById('clear_name_history').addEventListener("click", () => process.helper.actions({
      'action_name': "clear_name_history"
    }));
    document.getElementById("start_completing_tasks").addEventListener("click", () => process.helper.actions({
      'action_name': "community_tasks"
    }));
    document.getElementById("check_friends_limit").addEventListener("click", () => process.helper.actions({
      'action_name': 'check_friends_limit'
    }));
    document.getElementById("pin_by_message_history").onclick = () => process.helper.actions({
      'action_name': "pin_by_message_history"
    });
    document.getElementById("clear_comments").onclick = () => process.helper.actions({
      'action_name': "clear_comments"
    });
    document.getElementById("start_join_group").onclick = () => process.helper.actions({
      'action_name': "join_group"
    });
    document.getElementById("start_invite_group").onclick = () => process.helper.actions({
      'action_name': "invite_group"
    });
    document.getElementById("accept_all_invites").onclick = () => process.helper.actions({
      'action_name': "accept_invites"
    });
    document.getElementById("clear_incoming_invites").onclick = () => process.helper.actions({
      'action_name': "clear_incoming_invites"
    });
    document.getElementById("export_friends").onclick = () => process.helper.actions({
      'action_name': "export_friends"
    });
    document.getElementById("start_remove_friends_by_price").onclick = () => process.helper.actions({
      'action_name': "start_remove_friends_by_price"
    });
    document.getElementById("get_api_keys").onclick = () => process.helper.actions({
      'action_name': "get_api_keys"
    });
    document.getElementById("unblock_friends").onclick = () => process.helper.actions({
      'action_name': "unblock_friends"
    });
    document.getElementById("provide_mafile_path").addEventListener("click", () => {
      process.helper.provide_mafile_path();
    });
    document.getElementById('change_password').addEventListener("click", () => {
      process.helper.actions({
        'action_name': "change_password"
      });
    });
    document.getElementById("addFreeGames").addEventListener('click', () => {
      process.helper.actions({
        'action_name': 'addFreeGames'
      });
    });
    document.getElementById("setupProfileBackground").addEventListener("click", () => {
      process.helper.actions({
        'action_name': "setupProfileBackground"
      });
    });
    document.getElementById("setFavoriteBadge").addEventListener("click", () => {
      process.helper.actions({
        'action_name': 'setFavoriteBadge'
      });
    });
    document.getElementById('setStats').addEventListener("click", () => {
      process.helper.actions({
        'action_name': 'setStats'
      });
    });
    document.getElementById("getYearReviewBadge").addEventListener('click', () => {
      process.helper.actions({
        'action_name': "getYearReviewBadge"
      });
    });
    document.getElementById("setAvatarFrame").addEventListener("click", () => {
      process.helper.actions({
        'action_name': "setAvatarFrame"
      });
    });
    let _0x324304;
    document.getElementById('searchFriend').addEventListener("input", () => {
      clearTimeout(_0x324304);
      _0x324304 = setTimeout(() => process.helper.search_by_name(), 400);
    });
    let _0x3facfb;
    document.getElementById("accounts_group_name").addEventListener("input", _0x2f03cf => {
      clearTimeout(_0x3facfb);
      _0x3facfb = setTimeout(() => {
        const _0x1f837b = _0x2f03cf.target.value;
        if (_0x1f837b !== '' && process.account_groups[_0x1f837b]) {
          document.getElementById("accounts_group_area").value = process.account_groups[_0x1f837b];
        }
      }, 400);
    });
    document.getElementById('hideFriend').addEventListener("input", () => {
      process.helper.hide_by_name();
    });
    document.getElementById("unpin_all").addEventListener("click", () => process.helper.unpin_all());
    document.getElementById('scroll_up').addEventListener("click", () => document.querySelector('.friends').scrollIntoView());
    document.getElementById("scroll_down").addEventListener('click', () => document.querySelector(".friends").scrollIntoView(false));
    document.getElementById("add_group").addEventListener("click", () => process.helper.add_accounts_group());
    document.getElementById("remove_group").addEventListener('click', () => process.helper.remove_accounts_group());
    document.body.addEventListener("click", () => {
      document.querySelector(".user_actions_list").classList.add("hide");
      document.querySelector(".header_content_menu").classList.add("hide");
      document.getElementById("friendsModal").classList.remove("no_scroll");
      const emotionArea = document.querySelector(".emotion_area");
      if (emotionArea) {
        emotionArea.remove();
        document.querySelector('.chat_text_input').focus();
      }
    });
    document.body.onkeydown = (event: KeyboardEvent) => {
      const friendsActive = document.getElementById('friends').classList.contains("active");
      if (friendsActive && (event.keyCode === 40 || event.keyCode === 38)) {
        event.preventDefault();
        const openChat = document.querySelector(".lastMessages .open_chat");
        const keyCode = event.keyCode;
        const nextElementSibling = keyCode === 40 ? "nextElementSibling" : 'previousElementSibling';
        let orderIndex;
        if (!openChat) {
          orderIndex = process.min_order_index;
        } else {
          if (nextElementSibling === "nextElementSibling") {
            for (let i = Number(openChat.style.order) + 1; i <= process.current_order_index; i++) {
              const orderElement = document.querySelector('.order_' + i);
              if (orderElement && !orderElement.classList.contains("hide")) {
                orderIndex = i;
                break;
              }
            }
          } else {
            for (let i = Number(openChat.style.order) - 1; i >= process.min_order_index; i--) {
              const orderElement = document.querySelector(".order_" + i);
              if (orderElement && !orderElement.classList.contains("hide")) {
                orderIndex = i;
                break;
              }
            }
          }
        }
        let _0x3e109a = null;
        if (!openChat || !document.querySelector(".order_" + orderIndex)) {
          if (nextElementSibling === "nextElementSibling") {
            for (let i = process.min_order_index; i <= process.current_order_index; i++) {
              const orderElement = document.querySelector(".order_" + i);
              if (orderElement && !orderElement.classList.contains('hide')) {
                orderElement.click();
                orderElement.scrollIntoViewIfNeeded(true);
                break;
              }
            }
          } else {
          for (let i = process.current_order_index; i >= process.min_order_index; i--) {
              const orderElement = document.querySelector(".order_" + i);
              if (orderElement && !orderElement.classList.contains("hide")) {
                orderElement.click();
                orderElement.scrollIntoViewIfNeeded(true);
                break;
              }
            }
          }
        } else if (openChat) {
          orderElement = document.querySelector(".order_" + orderIndex);
        }
        if (orderElement) {
          orderElement.click();
          orderElement.scrollIntoViewIfNeeded(true);
        }
      }
    };
    window.ondragover = (event: DragEvent) => {
      event.preventDefault();
      return false;
    };
    window.ondrop = (event: DragEvent) => {
      event.preventDefault();
      return false;
    };
    process.sortable = new Sortable('.lastMessages');
    process.current_order_index = 0;
    process.min_order_index = 1;
    document.getElementById("import_invite_steamids").addEventListener("click", () => process.helper.import_invite_steamids());
    document.getElementById("import_wall_spam_steamids").addEventListener("click", () => process.helper.import_wall_spam_steamids());
    document.getElementById("onlineStats").addEventListener("mouseover", () => {
      const onlineStatesStatistic = process.helper.getOnlineStatesStatistic();
      let onlineStatesStatisticHtml = '';
      const onlineStates = [process.online_states["In-game"], process.online_states.Online, process.online_states.Busy, process.online_states.Away, process.online_states.Snooze, process.online_states.Offline];
      onlineStates.forEach(onlineState => {
        const onlineStateName = process.online_states[onlineState];
        const onlineStateCount = onlineStatesStatistic[onlineState];
        onlineStatesStatisticHtml += `<span class="${onlineState}">${onlineState}: ${onlineStateCount}</span><br/>`;
      });
      document.getElementById('onlineStatisticContainer').innerHTML = onlineStatesStatisticHtml;
    });
    document.getElementById("friendsModal").onscroll = (event: Event) => {
      const chatArea = document.querySelector(".chat");
      if (event.target.scrollTop >= process.settings.friends_area_offset) {
        if (chatArea) {
            chatArea.classList.add('scrolled');
        }
      } else if (chatArea) {
        chatArea.classList.remove('scrolled');
      }
    };
    document.querySelectorAll(".stop_action").forEach(stopAction => {
      stopAction.onclick = (event: Event) => {
        const {
          action: action,
          action_name: actionName
        } = event.currentTarget.dataset;
        for (const timeout in process.action_timeouts[action]) {
          clearTimeout(timeout);
          delete process.action_timeouts[action][timeout];
        }
        swal("Success", '' + actionName, "success");
        process.helper.print_info('' + actionName, "yellow");
      };
    });
    document.getElementById('youhack_link').onclick = () => process.helper.open_link("https://youhack.ru/threads/825803");
    document.getElementById("ino_link").onclick = () => process.helper.open_link('https://inosoft.market/invoice?product_name=multichat');
    document.getElementById("end_rent").onclick = () => process.helper.open_link("https://inosoft.market/invoice?product_name=multichat");
    document.getElementById('changelog_link').onclick = () => process.helper.open_link("https://inosoft.market/invoice?product_name=multichat#changelog");
    document.getElementById("user_id").onclick = () => {
      process.clipboard.writeText(user_key);
      swal("Success", process.languages[process.settings.language].software_id_copied, "success");
    };
    process.helper.getUuid().then(uuid => {
      ipcRenderer.send('send_uuid', {
        'id': user_key,
        'version': process.multichat_version,
        'uuid': uuid
      });
    });
    const programLanguage = document.getElementById("program_language");
    programLanguage.oninput = () => process.helper.set_program_language();
    programLanguage.value = process.settings.language;
    if (!windows) {
      const autoInstallUpdate = document.getElementById('auto_install_update');
      autoInstallUpdate.disabled = true;
      autoInstallUpdate.checked = false;
    }
    process.helper.read_mafiles();
    process.templates = process.helper.get_templates();
    process.domainTemplates = process.helper.getDomainTemplates();
    process.helper.render_customize_settings();
    process.helper.print_game_prices_settings();
    const checkGamePrices = () => {
      const _0x31e087 = !_0x1506fe || new Date() > new Date(_0x1506fe).setMilliseconds(msInDay);
      process.games.forEach(async _0x128dac => {
        process.prices[_0x128dac] = {};
        const _0x4b5971 = _0x128dac + ".json";
        const _0x3b9dfa = await process.helper.read_file(_0x4b5971);
        if (_0x3b9dfa) {
          process.prices[_0x128dac] = JSON.parse(_0x3b9dfa);
        }
        if (!_0x3b9dfa || _0x31e087) {
          const {
            status: _0x3234b9,
            response: _0x3597d7
          } = await loadSteamPriceByAppId('' + _0x128dac);
          if (_0x3234b9 && _0x3597d7.statusCode === 200) {
            process.storage.saveFile(_0x4b5971, _0x3597d7.body);
            process.prices[_0x128dac] = JSON.parse(_0x3597d7.body);
          }
        }
      });
      localStorage.setItem('last_price_checked', new Date());
    };
    checkGamePrices();
    process.storage.saveFile("language.txt", process.settings.language);
    process.helper.read_file('invite_blacklist.txt').then(inviteBlacklist => {
      if (inviteBlacklist) {
        inviteBlacklist.toString().trim().split(/\r?\n| /).forEach(inviteBlacklistItem => {
          if (inviteBlacklistItem !== '') {
            process.invite_blacklist.add(inviteBlacklistItem);
          }
        });
      }
    });
    process.helper.read_file("wall_spam_blacklist.txt").then(wallSpamBlacklist => {
      if (wallSpamBlacklist) {
        wallSpamBlacklist.toString().trim().split(/\r?\n| /).forEach(wallSpamBlacklistItem => {
          if (wallSpamBlacklistItem !== '') {
            process.wall_spam_blacklist[wallSpamBlacklistItem] = 1;
          }
        });
      }
    });
    ipcRenderer.on("check_for_update", async (event: Event, data: any) => {
      const {
        licenceExpire: licenceExpireDate,
        status: status,
        message: message
      } = data;
      const licenceExpireDate = new Date(licenceExpireDate);
      const _0x4a49c9 = new Date();
      const endRentDate = document.getElementById("end_rent");
      document.getElementById("user_id").innerText = user_key;
      endRentDate.innerText = licenceExpireDate.getFullYear() + '/' + process.helper.pretty_date(licenceExpireDate.getMonth() + 1) + '/' + process.helper.pretty_date(licenceExpireDate.getDate());
      if (licenceExpireDate - new Date() < 259200000) {
        _0x5e95a2.classList.add('rent_end');
      } else {
        _0x5e95a2.classList.remove("rent_end");
      }
      if (status && process.platform === "darwin" && !process.close_update) {
        const {
          version: latestVersion,
          description: latestVersionDescription
        } = await getLatestApplicationVersion();
        if (appVersionToNumber(latestVersion) > appVersionToNumber(process.multichat_version)) {
          const _0x4613b1 = await swal({
            'text': process.languages[process.settings.language].new_update_downloaded + "\n\nVersion: " + latestVersion + "\n" + latestVersionDescription.replace(/<p>|<\/p>|<li>|<\/li>|<ul>|<\/ul>|<ol>|<\/ol>/ig, ''),
            'buttons': {
              'confirm': "Install",
              'cancel': 'Later'
            }
          });
          if (_0x4613b1) {
            let _0x1ed886 = new remote.BrowserWindow({
              'webPreferences': {
                'devTools': false,
                'javascript': false,
                'nodeIntegration': false
              }
            });
            _0x1ed886.once('closed', () => {
              _0x1ed886 = null;
            });
            _0x1ed886.loadURL("https://inosoft.market/multichat_download?key=" + user_key + "&os=darwin");
            _0x1ed886.webContents.session.on("will-download", (_0x567941, _0x14b119, _0x4244ce) => {
              _0x14b119.on("updated", () => {
                if (_0x1ed886) {
                  _0x1ed886.close();
                }
              });
              _0x14b119.once("done", (_0x412120, _0x521554) => {
                if (_0x521554 === 'completed') {
                  swal('Success', "Успешно загружено. Распакуйте новую версию", "success");
                } else {
                  swal('Error', "Ошибка загрузки: " + _0x521554, "error");
                }
                if (_0x1ed886) {
                  _0x1ed886.close();
                }
              });
            });
          }
          process.close_update = true;
        }
      }
      if (!_0x1c466a) {
        ipcRenderer.send("change_window", "licence.html");
      } else {
        ipcRenderer.send("check_for_update");
      }
      process["0x_287432"] = _0x1c466a;
    });
    process.helper.read_file("id_for_invite.txt").then(_0x4184c6 => {
      document.getElementById('idLoadArea').value = _0x4184c6 ? _0x4184c6.toString() : '';
    });
    process.helper.read_file('wall_spam_id.txt').then(_0x2d80e0 => {
      document.getElementById("wall_spam_id").value = _0x2d80e0 ? _0x2d80e0.toString() : '';
    });
  };
  document.onkeydown = _0x406732 => {
    const _0x4a19b7 = _0x406732.ctrlKey || _0x406732.metaKey;
    if (_0x4a19b7 && _0x406732.keyCode == 70) {
      findInPage.openFindWindow();
    }
    if (_0x4a19b7 && _0x406732.key >= '0' && _0x406732.key <= '9') {
      const _0x52d840 = Number(_0x406732.key);
      const _0x4f9d42 = _0x52d840 === 0 ? 9 : _0x52d840 - 1;
      document.querySelector(".chat_footer_down")?.['children'][_0x4f9d42]?.["click"]();
    }
  };
  ipcRenderer.on('update-downloaded', async (_0x5d682b, _0x1053ed) => {
    const _0xb444b6 = document.getElementById("auto_install_update").checked;
    if (_0xb444b6) {
      ipcRenderer.send("install_update");
    } else {
      if (!process.close_update) {
        const _0xc4af6a = await swal({
          'text': process.languages[process.settings.language].new_update_downloaded + "\n\nVersion: " + _0x1053ed.releaseName + "\n" + _0x1053ed.releaseNotes.replace(/<p>|<\/p>|<li>|<\/li>|<ul>|<\/ul>|<ol>|<\/ol>/ig, ''),
          'buttons': {
            'confirm': 'Install',
            'cancel': "Later"
          }
        });
        if (_0xc4af6a) {
          ipcRenderer.send("install_update");
        }
        process.close_update = true;
      }
    }
  });
  ipcRenderer.on("suspend_and_resume", (_0xf3e64a, _0x5da22e) => {
    process.helper.suspend_and_resume(_0x5da22e);
  });
  ipcRenderer.on('exit', async () => {
    process.helper.save_localstorage();
  });
  document.getElementById("groupSteamid64Guide").onclick = () => {
    remote.shell.openExternal("https://steamcommunity.com/sharedfiles/filedetails/?id=1344514370");
  };
  if (process.settings.language === 'ru') {
    process.helper.print_info("Следите за обновлениями в нашем телеграм канале: @InoSteamMultichat", "grn", "https://t.me/InoSteamMultichat?start=multichat");
  } else {
    process.helper.print_info("Follow the updates in our telegram channel: @InoSteamMultichat", 'grn', "https://t.me/InoSteamMultichat?start=multichat");
  }
  window.onerror = function (_0x250ccf, _0x5aae5a, _0x3636de, _0x47dab4, _0x2e3650) {
    logger.error("Global error: " + _0x250ccf + " " + _0x5aae5a + " " + _0x3636de + " " + _0x47dab4 + " " + _0x2e3650);
  };
  window.addEventListener("unhandledrejection", function (_0x20e2ea) {
    logger.error("Uncaught (in promise): " + _0x20e2ea.reason);
  });