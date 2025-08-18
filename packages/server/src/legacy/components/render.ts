import steam from "../Profile";
import online_states from '../../recourses/states';
import {
  logger
} from './utils/logger';
const searchFriendInput = document.getElementById('searchFriend');
const hideFriendInput = document.getElementById("hideFriend");
const lastMessagesContainer = document.querySelector(".lastMessages");
const friendsArea = document.querySelector('.friendsArea');
const chatArea = document.querySelector('.chatArea');
Profile.prototype.print_account = async function () {
  const _0x2e47b7 = this.account.login;
  const _0x49005e = document.querySelector(".row_header.row_header_" + _0x2e47b7);
  if (!this.is_account_printed && !_0x49005e) {
    this.is_account_printed = true;
    friendsArea.insertAdjacentHTML("beforeend", "\n    <div class=\"row\" id=\"row_" + _0x2e47b7 + "\">\n    <div class=\"row_header row_header_" + _0x2e47b7 + "\">\n      <span id=\"nickname_" + _0x2e47b7 + "\">" + _0x2e47b7 + " " + (this.account_nickname ? '(' + this.account_nickname + ')' : '') + "</span>\n      <div class=\"message_counter message_counter_" + _0x2e47b7 + "\">0</div>\n    </div>\n    <div data-open_by_user=\"false\" class=\"row_body row_" + _0x2e47b7 + " hide\">\n      <div class=\"In-game_" + _0x2e47b7 + " In-game_block\"></div>\n      <div class=\"Online_" + _0x2e47b7 + " Online_block\"></div>\n      <div class=\"Away_" + _0x2e47b7 + " Away_block\"></div>\n      <div class=\"Busy_" + _0x2e47b7 + " Busy_block\"></div>\n      <div class=\"Snooze_" + _0x2e47b7 + " Snooze_block\"></div>\n      <div class=\"LookingToTrade_" + _0x2e47b7 + " LookingToTrade_block\"></div>\n      <div class=\"LookingToPlay_" + _0x2e47b7 + " LookingToPlay_block\"></div>\n      <div class=\"Offline_" + _0x2e47b7 + " offline_block Offline_block\"></div>\n      <div class=\"Deleted_" + _0x2e47b7 + "\"></div>\n    </div>\n    </div>\n    ");
    document.querySelector(".actions_accounts").insertAdjacentHTML("beforeend", "\n    <div class=\"actions_accounts_row\">\n      <span>" + _0x2e47b7 + "</span>\n      <input type=\"checkbox\" data-login=\"" + _0x2e47b7 + "\" class=\"action_checkbox\" id=\"action_account_" + _0x2e47b7 + "\">\n    </div>\n    ");
    this.update_account_messages_counter();
    this.print_deleted_friends();
    const _0x14da35 = document.querySelector('.row_header_' + _0x2e47b7);
    _0x14da35.onclick = () => {
      const _0x103a30 = document.querySelector(".row_" + _0x2e47b7);
      _0x103a30.classList.toggle('hide');
      _0x103a30.dataset.open_by_user = !_0x103a30.classList.contains("hide");
      this.is_account_opened = JSON.parse(_0x103a30.dataset.open_by_user);
      if (this.is_account_opened) {
        for (const _0x418fb2 in reverse_states) {
          document.querySelector('.' + _0x418fb2 + '_' + _0x2e47b7).innerHTML = '';
        }
        this.print_deleted_friends();
        for (const _0x160a61 in this.users) {
          requestIdleCallback(() => this.print_user(_0x160a61));
        }
        for (const _0x8b79e5 in process.hiddenOnlineStates) {
          const _0x52438f = process.hiddenOnlineStates[_0x8b79e5];
          if (_0x52438f) {
            const _0x817629 = document.querySelector('.' + _0x8b79e5 + '_' + this.account.login);
            _0x817629.innerHTML = '';
            _0x817629.classList.add("hide");
          }
        }
      } else {
        for (const _0x34b103 in reverse_states) {
          document.querySelector('.' + _0x34b103 + '_' + _0x2e47b7).innerHTML = '';
        }
      }
    };
    _0x14da35.oncontextmenu = _0x3803c0 => process.helper.show_user_actions_list(_0x3803c0, _0x2e47b7, null, 'header_content_menu');
  } else {
    this.is_account_printed = true;
  }
};
Profile.prototype.print_user = function (_0x10a16f, _0x1fe56d, _0x33bc1d = process.settings.pin_direction) {
  try {
    user = this.users[_0x10a16f];
    if (_0x10a16f === this.clientSteamID64 || !user || this.myFriends[_0x10a16f] !== 0x3) {
      return;
    }
    if (!user.customized) {
      this.customize_user_info(_0x10a16f, user);
    }
    const _0x4c4c23 = this.account.login;
    const _0x5c415c = online_states[user.persona_state];
    const _0x42591e = document.querySelector(".row_" + _0x4c4c23 + " .row_user.row_user_" + _0x10a16f + '_' + _0x4c4c23);
    const _0x479520 = lastMessagesContainer.querySelector(".row_user.row_user_" + _0x10a16f + '_' + _0x4c4c23);
    const _0xc0630d = process.hiddenOnlineStates[_0x5c415c];
    const _0x4391b3 = this.unread_messages[_0x10a16f] ? this.unread_messages[_0x10a16f] : 0x0;
    const _0xeafe6 = !!this.new_friends[_0x10a16f];
    const _0x45d523 = searchFriendInput.value.trim().toLowerCase();
    const _0x75ba37 = hideFriendInput.value.trim().toLowerCase();
    const _0x368f27 = (user.render_player_name || this.getRenderPlayerName(_0x10a16f, user)).toLowerCase();
    let _0x21a00c = false;
    let _0x47cc41 = null;
    if (_0x45d523 !== '' && _0x368f27.search(RegExp.escape(_0x45d523)) === -0x1 || _0x75ba37 !== '' && _0x368f27.search(RegExp.escape(_0x75ba37)) !== -0x1) {
      _0x21a00c = true;
    }
    const _0x3a4f58 = _0x21a00c ? 'hide' : '';
    const _0x3ad6d6 = _0xeafe6 ? "newFriend" : '';
    const _0x14188a = this.deleted_friends[_0x10a16f] ? "deleted_friend" : '';
    const _0x2f1384 = _0xc0630d ? "hide" : '';
    const _0x460e3e = process.open_chat && process.open_chat[_0x4c4c23] && process.open_chat[_0x4c4c23] == _0x10a16f ? "open_chat" : '';
    const _0x36204e = !!this.muted[_0x10a16f];
    if (_0xc0630d) {
      if (_0x42591e) {
        _0x42591e.remove();
      }
      if (_0x479520) {
        _0x479520.remove();
      }
      return false;
    }
    if (_0x5c415c === "In-game" && user.rich_presence && user.rich_presence.length > 0x0) {
      const _0x57d455 = user.rich_presence.filter(_0xd97227 => _0xd97227.key === 'steam_player_group_size');
      if (_0x57d455.length > 0x0) {
        _0x47cc41 = Number(_0x57d455[0x0].value) - 0x1;
      }
    }
    let _0x1f0bde = "<div data-name=\"" + _0x368f27 + "\" data-pinned=\"false\" data-account_login=\"" + _0x4c4c23 + "\" class=\"" + _0x5c415c + " " + _0x14188a + " row_user row_user_" + _0x10a16f + '_' + _0x4c4c23 + " " + _0x3a4f58 + " " + _0x460e3e + "\">";
    let _0x4a8bf0 = "\n      <div class=\"row_user_item\">\n        <img class=\"user_actions_" + _0x10a16f + '_' + _0x4c4c23 + "\" src=\"" + user.avatar_url_medium + "\">\n      </div>\n      <div class=\"row_user_item\">\n        <span class=\"player_name player_name_" + _0x10a16f + '_' + _0x4c4c23 + "\">" + user.render_player_name + "\n        " + (user.persona_state_flags === 0x200 || user.persona_state_flags === 0x201 ? "\n        <svg version=\"1.1\" id=\"Layer_2\" xmlns=\"http://www.w3.org/2000/svg\" class=\"SVGIcon_MobilePhone\" x=\"0px\" y=\"0px\" width=\"256px\" height=\"256px\" viewBox=\"0 0 256 256\"><path d=\"M165.693,45.186H91.368c-7.963,0-14.41,6.447-14.41,14.41V210.9c0,7.964,6.447,14.41,14.41,14.41h74.134 c7.965,0,14.41-6.447,14.41-14.41V59.596C180.102,51.633,173.657,45.186,165.693,45.186z M113.172,57.509h30.717 c1.707,0,3.223,1.327,3.223,3.224c0,1.896-1.328,3.223-3.223,3.223h-30.717c-1.707,0-3.223-1.328-3.223-3.223 C109.949,58.837,111.465,57.509,113.172,57.509z M128.529,213.554c-4.551,0-8.152-3.603-8.152-8.153c0-4.55,3.604-8.152,8.152-8.152 s8.151,3.603,8.151,8.152C136.682,209.761,133.081,213.554,128.529,213.554z M169.105,186.819h-81.15V74.384h81.15V186.819 L169.105,186.819z\"></path></svg>" : '') + "\n        </span>\n        <span>\n        " + (_0x5c415c === "In-game" ? (process.app_ids[user.gameid] ? process.app_ids[user.gameid] : '') + "\n        " + (user.rich_presence_string ? user.rich_presence_string : '') : '') + "\n        " + (_0x5c415c === "Offline" && !_0x14188a ? '' + process.helper.get_offline_time(user.last_seen_online) : '') + "\n        " + (_0x47cc41 ? "<div class=\"groups_size\"><span class=\"groups_size_count\">+" + _0x47cc41 + "</span>Playing with " + _0x47cc41 + " other person</div>" : '') + "\n        </span>\n      </div>\n      <div class=\"row_user_item\">\n        " + (!_0x14188a ? _0x5c415c : "Deleted") + "\n      </div>\n      <div class=\"message_counter message_counter_" + _0x10a16f + '_' + _0x4c4c23 + " " + (_0x4391b3 === 0x0 ? 'hide' : '') + "\">" + _0x4391b3 + "</div>\n      <div class=\"muted muted_" + _0x10a16f + '_' + _0x4c4c23 + "\"> " + (_0x36204e ? "<img src=\"./img/mute.png\">" : '') + "</div>\n      </div>\n    ";
    if (_0x1fe56d === "print_offline" || _0x1fe56d === "search_by_name") {
      document.querySelector('.' + _0x5c415c + '_' + _0x4c4c23).insertAdjacentHTML("beforeend", _0x1f0bde + _0x4a8bf0);
    } else {
      if (this.is_account_opened && _0x1fe56d !== "pin") {
        if (_0x42591e) {
          if (user.last_persona_state == user.persona_state) {
            _0x42591e.outerHTML = _0x1f0bde + _0x4a8bf0;
          } else {
            _0x42591e.remove();
            document.querySelector('.' + _0x5c415c + '_' + _0x4c4c23).insertAdjacentHTML("beforeend", _0x1f0bde + _0x4a8bf0);
          }
        } else {
          document.querySelector('.' + _0x5c415c + '_' + _0x4c4c23).insertAdjacentHTML('beforeend', _0x1f0bde + _0x4a8bf0);
        }
      }
      if ((_0x1fe56d === 'pin' || this.pinned[_0x10a16f]) && !_0x479520) {
        _0x1f0bde = "<div data-name=\"" + _0x368f27 + "\" draggable=\"true\" data-pinned=\"true\" data-account_login=\"" + _0x4c4c23 + "\" class=\"" + _0x5c415c + " " + _0x2f1384 + " row_user row_user_" + _0x10a16f + '_' + _0x4c4c23 + " " + _0x3a4f58 + " " + _0x3ad6d6 + " " + _0x14188a + " " + _0x460e3e + "\">";
        lastMessagesContainer.insertAdjacentHTML('beforeend', _0x1f0bde + _0x4a8bf0);
        this.pinned[_0x10a16f] = 0x1;
        localStorage.setItem(this.account.login + "_pinned", JSON.stringify(this.pinned));
      }
      if (_0x479520) {
        const _0x3bc0ac = _0x479520.classList;
        _0x1f0bde = "<div data-name=\"" + _0x368f27 + "\" draggable=\"true\" data-pinned=\"true\" data-account_login=\"" + _0x4c4c23 + "\" class=\"order_" + _0x479520.style.order + " " + _0x5c415c + " " + _0x2f1384 + " row_user row_user_" + _0x10a16f + '_' + _0x4c4c23 + " " + (_0x3bc0ac.contains('new') ? "new" : '') + " " + _0x3a4f58 + " " + _0x3ad6d6 + " " + _0x14188a + " " + _0x460e3e + "\" " + (_0x479520.style.order ? "style=\"order: " + _0x479520.style.order + "\"" : '') + '>';
        _0x479520.outerHTML = _0x1f0bde + _0x4a8bf0;
      }
    }
    const _0x1ff066 = chatArea.querySelector(".chat_" + _0x4c4c23 + '_' + _0x10a16f);
    if (_0x1ff066 && user.last_persona_state !== user.persona_state) {
      const _0x1f86c9 = online_states[user.last_persona_state];
      const _0x30706b = _0x1ff066.querySelectorAll('.' + _0x1f86c9);
      for (let _0x2ab25d = 0x0; _0x2ab25d < _0x30706b.length; _0x2ab25d++) {
        _0x30706b[_0x2ab25d].classList.replace(_0x1f86c9, _0x5c415c);
      }
    }
    const _0x214dba = document.querySelectorAll(".row_user_" + _0x10a16f + '_' + _0x4c4c23);
    for (let _0x29852d = 0x0; _0x29852d < _0x214dba.length; _0x29852d++) {
      _0x214dba[_0x29852d].onclick = () => this.create_chat(_0x10a16f);
      _0x214dba[_0x29852d].oncontextmenu = () => this.pinned[_0x10a16f] && JSON.parse(_0x214dba[_0x29852d].dataset.pinned) ? this.unpin(_0x10a16f) : this.print_user(_0x10a16f, "pin");
      _0x214dba[_0x29852d].querySelector('.user_actions_' + _0x10a16f + '_' + _0x4c4c23).onclick = _0x542bee => process.helper.show_user_actions_list(_0x542bee, _0x4c4c23, _0x10a16f);
    }
    const _0x386f99 = lastMessagesContainer.querySelector(".row_user.row_user_" + _0x10a16f + '_' + _0x4c4c23);
    if (_0x386f99) {
      if (!_0x386f99.style.order) {
        if (_0x33bc1d === "bottom") {
          _0x386f99.style.order = ++process.current_order_index;
        } else {
          _0x386f99.style.order = --process.min_order_index;
        }
        _0x386f99.classList.add("order_" + _0x386f99.style.order);
      }
      _0x386f99.ondragstart = _0x422e1c => process.sortable.on_drag_start(_0x422e1c, ".row_user_" + _0x10a16f + '_' + _0x4c4c23);
    }
  } catch (err: unknown) {
    logger.error("print_user " + err);
  }
};
Profile.prototype.print_deleted_friends = function () {
  for (const _0x112470 in this.deleted_friends) {
    const _0x175e38 = this.deleted_friends[_0x112470];
    if (process.settings.save_deleted_friends) {
      try {
        _0x175e38.inventory = typeof _0x175e38.inventory === "object" ? _0x175e38.inventory : {};
        _0x175e38.render_player_name = this.client.myNicknames[_0x112470] ? _0x175e38.player_name + " (" + this.client.myNicknames[_0x112470] + ')' : _0x175e38.player_name;
        _0x175e38.render_player_name = _0x175e38.render_player_name.replace(/"/g, '');
        _0x175e38.persona_state = 0x0;
        this.users[_0x112470] = _0x175e38;
        this.myFriends[_0x112470] = 0x3;
      } catch (err: unknown) {
        delete this.deleted_friends[_0x112470];
        delete this.users[_0x112470];
        delete this.myFriends[_0x112470];
      }
    } else {
      delete this.users[_0x112470];
      delete this.myFriends[_0x112470];
    }
  }
};
Profile.prototype.unpin = function (_0x20b866) {
  const _0x362891 = lastMessagesContainer.querySelector('.row_user_' + _0x20b866 + '_' + this.account.login);
  if (_0x362891) {
    _0x362891.remove();
  }
  delete this.pinned[_0x20b866];
  localStorage.setItem(this.account.login + "_pinned", JSON.stringify(this.pinned));
};
Profile.prototype.new_name_modal = async function (_0xf8d1f9) {
  const _0x4940bc = this.users[_0xf8d1f9].render_player_name;
  const _0x5b531e = await swal({
    'text': process.languages[process.settings.language].new_username_for + " " + _0x4940bc,
    'content': 'input',
    'buttons': {
      'cancel': "Cancel",
      'confirm': "Set name"
    }
  });
  if (_0x5b531e) {
    this.new_name(_0xf8d1f9, _0x5b531e);
  }
};
Profile.prototype.invites_modal = async function () {
  const _0x162871 = this.account.login;
  document.querySelector(".invitesUser").innerHTML = _0x162871 + " ";
  document.getElementById("receivied_invites").innerHTML = '';
  document.getElementById("sent_invites").innerHTML = '';
  const _0x1014bf = await this.get_invites();
  if (_0x1014bf) {
    let _0x58c37e = 0x0;
    let _0x2b1baa = 0x0;
    _0x1014bf.forEach(_0x45e73a => {
      const _0x26f853 = _0x45e73a.type === 0x4 ? "sent_invites" : 'receivied_invites';
      document.getElementById(_0x26f853).insertAdjacentHTML("beforeend", "\n      <div class=\"invite\" id=\"invite_id_" + _0x45e73a.user_id + "\">\n      <div class=\"invite_avatar\">\n        <img class=\"profileAvatar\" src=\"" + _0x45e73a.avatar + "\" alt=\"avatar\" height=\"32\" width=\"32\">\n        <div class=\"invite_name\">\n          " + _0x45e73a.name + "\n        </div>\n      </div>\n      <div class=\"invite_buttons\">\n        " + (_0x45e73a.type === 0x4 ? "<button id=\"cancel_" + _0x45e73a.user_id + "\" class=\"flat_btn danger\">Cancel</button>" : "<button id=\"accept_" + _0x45e73a.user_id + "\" class=\"flat_btn green\">Accept</button>\n        <button id=\"ignore_" + _0x45e73a.user_id + "\" class=\"flat_btn danger\">Ignore</button>\n        <button id=\"block_" + _0x45e73a.user_id + "\" class=\"flat_btn danger\">Block</button>") + "\n      </div>\n    </div>\n      ");
      if (_0x45e73a.type === 0x4) {
        _0x58c37e++;
        document.getElementById("cancel_" + _0x45e73a.user_id).onclick = () => this.decline_invite(_0x45e73a.user_id);
      } else {
        _0x2b1baa++;
        document.getElementById("accept_" + _0x45e73a.user_id).onclick = () => this.accept_invite(_0x45e73a.user_id);
        document.getElementById("ignore_" + _0x45e73a.user_id).onclick = () => this.decline_invite(_0x45e73a.user_id);
        document.getElementById('block_' + _0x45e73a.user_id).onclick = () => this.decline_invite(_0x45e73a.user_id, "block");
      }
    });
    document.getElementById('sent_invites_count').innerText = '(' + _0x58c37e + ')';
    document.getElementById("received_invites_count").innerText = '(' + _0x2b1baa + ')';
    document.getElementById('invitesModal').style.display = 'flex';
  }
};
Profile.prototype.printFriendsByOnlineState = function (_0x1f24a3) {
  const _0x527a15 = document.querySelector('.' + _0x1f24a3 + '_' + this.account.login);
  if (_0x527a15) {
    _0x527a15.innerHTML = '';
    _0x527a15.classList.remove("hide");
    if (this.is_account_opened) {
      for (const _0x157eeb in this.users) {
        if (this.users[_0x157eeb].persona_state == online_states[_0x1f24a3]) {
          requestIdleCallback(() => this.print_user(_0x157eeb));
        }
      }
    } else {
      for (const _0x3630d1 in this.users) {
        if (this.users[_0x3630d1].persona_state == online_states[_0x1f24a3]) {
          if (this.pinned[_0x3630d1]) {
            requestIdleCallback(() => this.print_user(_0x3630d1, "pin"));
          }
        }
      }
    }
  }
};
Profile.prototype.print_offline = function () {
  const _0x237ea0 = document.querySelector(".Offline_" + this.account.login);
  if (_0x237ea0) {
    _0x237ea0.innerHTML = '';
    _0x237ea0.classList.remove("hide");
    if (this.is_account_opened) {
      for (const _0x330c7f in this.users) {
        if (this.users[_0x330c7f].persona_state == 0x0) {
          requestIdleCallback(() => this.print_user(_0x330c7f));
        }
      }
    } else {
      for (const _0x28ebd6 in this.users) {
        if (this.users[_0x28ebd6].persona_state == 0x0) {
          if (this.pinned[_0x28ebd6]) {
            requestIdleCallback(() => this.print_user(_0x28ebd6, "pin"));
          }
        }
      }
    }
  }
};
Profile.prototype.search_by_name = function (_0x44eb4b) {
  try {
    const _0x4d6921 = this.account.login;
    const _0x432d08 = new RegExp(_0x44eb4b, 'i');
    document.querySelector(".row_body.row_" + _0x4d6921).classList.remove("hide");
    for (const _0x13b40c in this.users) {
      if (this.myFriends[_0x13b40c] === 0x3) {
        const _0x562a6d = this.users[_0x13b40c];
        const _0x50c86f = document.querySelector(".row_body.row_" + _0x4d6921 + " .row_user_" + _0x13b40c + '_' + _0x4d6921);
        if (this.is_account_opened) {
          if (_0x50c86f) {
            if (_0x50c86f.dataset.name.search(_0x44eb4b) !== -0x1 || _0x44eb4b == '') {
              _0x50c86f.classList.remove('hide');
            } else {
              _0x50c86f.classList.add("hide");
            }
            const _0x2021c9 = online_states[_0x562a6d.persona_state];
            if (process.hiddenOnlineStates[_0x2021c9]) {
              _0x50c86f.classList.add("hide");
            }
          }
        } else {
          if (_0x562a6d.render_player_name.search(_0x432d08) !== -0x1) {
            if (!_0x50c86f) {
              this.print_user(_0x13b40c, "search_by_name");
            } else {
              _0x50c86f.classList.remove("hide");
            }
          } else {
            if (_0x50c86f) {
              _0x50c86f.classList.add("hide");
            }
          }
        }
      }
    }
    if (!this.is_account_opened && _0x44eb4b === '') {
      for (const _0x1e712e in reverse_states) {
        document.querySelector('.' + _0x1e712e + '_' + _0x4d6921).innerHTML = '';
      }
    }
  } catch (err: unknown) {}
};
Profile.prototype.pin_by_online_state = function (_0x2936aa) {
  this.getSteamidsByOnlineStates(_0x2936aa).forEach(_0x53787c => {
    requestIdleCallback(() => this.print_user(_0x53787c, "pin"));
  });
};
Profile.prototype.pin_by_unread_messages = function (_0x32acff) {
  this.getSteamidsByOnlineStates(_0x32acff).forEach(_0x2ff675 => {
    if (this.unread_messages[_0x2ff675]) {
      this.print_user(_0x2ff675, 'pin');
    }
  });
};
const getItemDescription = _0x43260d => {
  if (_0x43260d.nonTradable) {
    return "<span class=\"inventoryItemNonTradable\">Not tradable</span>";
  }
  if (_0x43260d.hold) {
    return "<span class=\"inventoryItemNonTradable\">Hold</span>";
  }
  return '';
};
Profile.prototype.renderItems = function (_0x6d1679, _0x4fb188) {
  const _0x17f92c = this.users[_0x6d1679];
  if (!_0x17f92c || !_0x17f92c.inventory || !_0x17f92c.inventory[_0x4fb188] || !_0x17f92c.inventory[_0x4fb188].items) {
    return '';
  }
  const _0x285f4b = _0x17f92c.inventory[_0x4fb188].items || [];
  let _0x7fd69 = '';
  _0x285f4b.map(_0xb28f96 => {
    _0x7fd69 += "\n      <div class=\"inventoryItem\">\n        " + getItemDescription(_0xb28f96) + "\n        <img class=\"inventoryItemImage\" src=\"https://community.cloudflare.steamstatic.com/economy/image/class/" + _0x4fb188 + '/' + _0xb28f96.classid + "/256x128\" alt=\"" + _0xb28f96.name + "\" title=\"" + _0xb28f96.name + "\" loading=\"lazy\">\n        <span>" + _0xb28f96.price.toFixed(0x2) + " $</span>\n      </div>\n    ";
  });
  return _0x7fd69;
};
Profile.prototype.print_inventory = async function (_0x2afafa) {
  const _0x78db23 = this.users[_0x2afafa];
  if (!_0x78db23) {
    return;
  }
  process.selected_games.map(_0x3ace0f => {
    if (_0x78db23.inventory[_0x3ace0f] && _0x78db23.inventory[_0x3ace0f].inventory_price !== "unchecked" && document.querySelector(".prices_" + _0x2afafa)) {
      document.querySelector(".price_block_" + _0x3ace0f).classList.remove("hide");
      document.getElementById(_0x3ace0f + "_price").innerText = _0x78db23.inventory[_0x3ace0f].inventory_price;
      if (_0x78db23.inventory[_0x3ace0f].inventory_hold_price !== "unchecked" && _0x78db23.inventory[_0x3ace0f].inventory_hold_price !== "0.00") {
        document.getElementById(_0x3ace0f + "_hold_price").innerText = _0x78db23.inventory[_0x3ace0f].inventory_hold_price + " $";
        document.getElementById(_0x3ace0f + "_hold_price").classList.remove('hide');
      }
      const _0x129b07 = document.querySelector(".hours_tooltiptext_" + _0x3ace0f);
      if (_0x129b07 && _0x78db23.inventory && _0x78db23.inventory[_0x3ace0f] && _0x78db23.inventory[_0x3ace0f].expensive_item) {
        const _0x129f82 = _0x78db23.inventory[_0x3ace0f].expensive_item;
        _0x129b07.style.width = '750px';
        _0x129b07.style.marginLeft = '-385px';
        _0x129b07.style.top = "100%";
        document.querySelector(".expensive_item_" + _0x3ace0f).innerHTML = "\n          <div class=\"expensive_item\">\n            <span>Dearest item: " + _0x129f82.name + " Price: " + _0x129f82.price.toFixed(0x2) + "$</span>\n          </div>\n          <div class=\"full_inventory_body\" id=\"" + _0x2afafa + "_full_inventory_" + _0x3ace0f + "\">\n            " + this.renderItems(_0x2afafa, _0x3ace0f) + "\n          </div>\n        ";
      }
    }
  });
};
Profile.prototype.print_games_info = function (_0x44e109) {
  const _0x5de7c6 = this.users[_0x44e109];
  if (_0x5de7c6 && document.querySelector(".prices_" + _0x44e109)) {
    process.selected_games.forEach(_0x2aa992 => {
      const _0x4e05c1 = document.querySelector(".hours_tooltiptext_" + _0x2aa992);
      if (_0x4e05c1 && _0x5de7c6.games_info[_0x2aa992] && _0x5de7c6.games_info[_0x2aa992].status) {
        document.querySelector(".hours_info_" + _0x2aa992).innerHTML = ("\n        <div class=\"hours_info\">\n          <span>Hours: " + (_0x5de7c6.games_info[_0x2aa992].hours_forever || 0x0) + "</span>\n        </div>\n        ").trim();
      }
    });
  }
};
Profile.prototype.print_profile_info = async function (_0x17dbc6) {
  const _0x158e51 = this.users[_0x17dbc6];
  const _0x255b88 = document.querySelector(".user_info_" + _0x17dbc6);
  if (_0x158e51 && _0x255b88) {
    _0x255b88.innerHTML = '';
    _0x255b88.insertAdjacentHTML("beforeend", "\n    " + (_0x158e51.user_info.lvl ? "\n    <div class=\"" + _0x158e51.user_info.lvl_class + "\">\n      <span class=\"friendPlayerLevelNum\">" + _0x158e51.user_info.lvl + "</span>\n    </div>\n    " : '') + "\n    " + (_0x158e51.user_info.country ? "\n    <img src=\"" + _0x158e51.user_info.country + "\">\n    " : '') + "\n    ");
  }
};
Profile.prototype.print_trade_hold_info = async function (_0xad6bd7) {
  const _0x289062 = this.users[_0xad6bd7];
  const _0xa7d8a2 = document.querySelector(".trade_hold_" + _0xad6bd7);
  if (_0x289062 && _0xa7d8a2) {
    _0xa7d8a2.innerHTML = '';
    _0xa7d8a2.insertAdjacentHTML("beforeend", "\n      <p>Trade Hold</p>\n      <p>" + _0x289062.trade_hold_info.escrow + " days<p>\n    ");
  }
};
Profile.prototype.print_emotions = function (_0x255441) {
  _0x255441.stopPropagation();
  const _0x319e12 = document.querySelector(".emotion_area");
  if (!_0x319e12) {
    document.querySelector(".chat_footer_up").insertAdjacentHTML("beforeend", "\n      <div class=\"emotion_area\"></div>\n    ");
    const _0x149f60 = document.querySelector(".emotion_area");
    _0x149f60.innerHTML = '';
    for (const _0x591ad5 in this.emotions) {
      const _0x20298e = this.emotions[_0x591ad5].name;
      const _0x339add = _0x20298e.replace(/:/g, '');
      _0x149f60.insertAdjacentHTML("beforeend", "<img id=\"emotion_" + _0x339add + "\" src=\"https://steamcommunity-a.akamaihd.net/economy/emoticonlarge/" + _0x339add + "\"/>");
      document.getElementById('emotion_' + _0x339add).onclick = () => document.querySelector(".chat_text_input").value += _0x20298e;
    }
  }
};