import Profile from "../Profile";
import fs from 'fs';
import {
  logger
} from "./utils/logger";
const chatArea = document.querySelector(".chatArea");
Profile.prototype.create_chat = async function (_0x5c6618) {
  try {
    const _0x18c995 = this.users[_0x5c6618];
    const _0x3a50f2 = this.account.login;
    const _0x16fd5 = online_states[_0x18c995.persona_state];
    if (!_0x18c995.inventory) {
      _0x18c995.inventory = {};
    }
    if (!_0x18c995.user_info) {
      _0x18c995.user_info = {};
    }
    if (!_0x18c995.games_info) {
      _0x18c995.games_info = {};
    }
    const _0x3b6bbd = !!(Object.keys(_0x18c995.inventory).length > 0);
    const _0x30ba3e = !!(Object.keys(_0x18c995.user_info).length > 0);
    const _0x3bf9bd = !!(Object.keys(_0x18c995.games_info).length > 0);
    if (chatArea.querySelector(".chat")) {
      this.remove_chat();
    }
    chatArea.insertAdjacentHTML("beforeend", "\n      <div data-user_id=\"" + _0x5c6618 + "\" data-login=\"" + _0x3a50f2 + "\" class=\"chat chat_" + _0x3a50f2 + '_' + _0x5c6618 + "\">\n        <div class=\"chat_header\">\n          <div class =\"chat_header_left " + _0x16fd5 + "\">\n            <img id=\"chat_avatar_user_actions_list\" src=\"" + _0x18c995.avatar_url_medium + "\" height=\"40px\">\n            <div class=\"chat_nicknames\">\n              <span id=\"edit_name\" contenteditable=\"true\" class=\"" + _0x16fd5 + " nickname player_name_" + _0x5c6618 + '_' + _0x3a50f2 + " chat_header_left_item\">\n              " + _0x18c995.render_player_name + "\n              " + (_0x18c995.persona_state_flags === 512 || _0x18c995.persona_state_flags === 513 ? "\n              <svg version=\"1.1\" id=\"Layer_2\" xmlns=\"http://www.w3.org/2000/svg\" class=\"SVGIcon_MobilePhone\" x=\"0px\" y=\"0px\" width=\"256px\" height=\"256px\" viewBox=\"0 0 256 256\"><path d=\"M165.693,45.186H91.368c-7.963,0-14.41,6.447-14.41,14.41V210.9c0,7.964,6.447,14.41,14.41,14.41h74.134 c7.965,0,14.41-6.447,14.41-14.41V59.596C180.102,51.633,173.657,45.186,165.693,45.186z M113.172,57.509h30.717 c1.707,0,3.223,1.327,3.223,3.224c0,1.896-1.328,3.223-3.223,3.223h-30.717c-1.707,0-3.223-1.328-3.223-3.223 C109.949,58.837,111.465,57.509,113.172,57.509z M128.529,213.554c-4.551,0-8.152-3.603-8.152-8.153c0-4.55,3.604-8.152,8.152-8.152 s8.151,3.603,8.151,8.152C136.682,209.761,133.081,213.554,128.529,213.554z M169.105,186.819h-81.15V74.384h81.15V186.819 L169.105,186.819z\"></path></svg>" : '') + "\n              </span>\n              <span class='my_account chat_header_left_item'>" + _0x3a50f2 + "</span>\n            </div>\n            <div class=\"user_info user_info_" + _0x5c6618 + "\"></div>\n            <div class=\"prices prices_" + _0x5c6618 + "\"></div>\n            <div class=\"trade_hold trade_hold_" + _0x5c6618 + "\"></div>\n          </div>\n          <div class = \"chat_header_right\">\n            <button id=\"chat_delete_friend\" class=\"flat_btn danger\">Delete</button>\n            <span class=\"online\">|</span>\n            <button id=\"chat_block_friend\" class=\"flat_btn danger\">Block</button>\n            <span class=\"online\">|</span>\n            <button id=\"chat_block_delete_friend\" class=\"flat_btn danger\">Block + Delete</button>\n            <span id=\"remove_chat\" class=\"close_chat\">&times;</span>\n          </div>\n        </div>\n        <div class=\"chat_body chat_body_" + _0x3a50f2 + '_' + _0x5c6618 + "\">\n        </div>\n        <div class=\"chat_footer\">\n          <div class=\"chat_footer_type chat_footer_type_" + _0x3a50f2 + '_' + _0x5c6618 + "\">\n            " + _0x18c995.render_player_name + " typing ...\n          </div>\n          <div class=\"chat_footer_up\">\n            <textArea maxlength=\"5000\" class=\"chat_text_input\" id='input_" + _0x5c6618 + "'></textArea>\n            <button class=\"chat_btn\" id='button_" + _0x5c6618 + "'>\n              <svg fill=\"#FFFFFF\" xmlns=\"http://www.w3.org/2000/svg\" class=\"SVGIcon_Button SVGIcon_Submit\" version=\"1.1\" x=\"0px\" y=\"0px\" viewBox=\"0 0 100 100\"><g transform=\"translate(0,-952.36218)\"><path d=\"m 92.115057,974.14842 a 2.0001999,2.0001999 0 0 0 -1.96764,2.02965 l 0.0376,31.19553 -77.475501,0 16.161909,-15.73013 a 2.0002746,2.0002746 0 1 0 -2.790355,-2.8667 L 6.3913393,1007.9405 a 2.0001999,2.0001999 0 0 0 -0.0011,2.8646 l 19.6896957,19.2036 a 2.0002671,2.0002671 0 1 0 2.792551,-2.8646 l -16.170767,-15.771 79.153048,0 a 2.0001999,2.0001999 0 0 0 1.72959,-0.5437 2.0001999,2.0001999 0 0 0 0.0598,-0.058 2.0001999,2.0001999 0 0 0 0.54259,-1.7218 l -0.0388,-32.87638 a 2.0001999,2.0001999 0 0 0 -2.03297,-2.02522 z\" fill=\"#FFFFFF\" fill-opacity=\"1\" fill-rule=\"evenodd\" stroke=\"none\" visibility=\"visible\" display=\"inline\" overflow=\"visible\"></path></g></svg>\n            </button>\n            <button class=\"chat_btn emotions\" id=\"emotions_" + _0x5c6618 + "\" >\n              <svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" class=\"SVGIcon_Button SVGIcon_Emoticon\" x=\"0px\" y=\"0px\" width=\"256px\" height=\"256px\" viewBox=\"0 0 256 256\"><circle fill=\"none\" stroke=\"#ffffff\" stroke-width=\"12\" stroke-miterlimit=\"10\" cx=\"128\" cy=\"128\" r=\"107.5\"></circle><path fill=\"none\" stroke=\"#ffffff\" stroke-width=\"12\" stroke-linecap=\"round\" stroke-miterlimit=\"10\" d=\"M74.484,145.945 c0,0,12.996,37.533,53.514,37.533c38.084,0,53.499-37.533,53.499-37.533\"></path><line fill=\"none\" stroke=\"#ffffff\" stroke-width=\"12\" stroke-linecap=\"round\" stroke-miterlimit=\"10\" x1=\"94.5\" y1=\"97.5\" x2=\"94.5\" y2=\"109.5\"></line><line fill=\"none\" stroke=\"#ffffff\" stroke-width=\"12\" stroke-linecap=\"round\" stroke-miterlimit=\"10\" x1=\"160.5\" y1=\"97.5\" x2=\"160.5\" y2=\"109.5\"></line></svg>\n            </button>\n          </div>\n          <div class=\"typing_template typing_template_" + _0x5c6618 + "\"></div>\n        </div>\n      </div>\n    ");
    const _0x594de9 = document.querySelector(".chat");
    const _0x4a4f2f = document.querySelector(".chat_body");
    const _0x33cce3 = document.getElementById("edit_name");
    const _0x546d94 = document.getElementById('input_' + _0x5c6618);
    const _0x2d7520 = _0x13f47b => {
      _0x13f47b.forEach(_0x576faf => {
        try {
          const _0x204b5c = process.helper.pretty_time(_0x576faf.timestamp);
          const _0x4a7aaf = typeof _0x576faf.steam_id == 'string' ? _0x576faf.steam_id : _0x576faf.steam_id.getSteamID64();
          const _0x55f90a = !!(_0x4a7aaf == _0x5c6618);
          const _0x294b1f = new Date(_0x576faf.timestamp).toLocaleDateString(process.settings.language === 'ru' ? "ru-RU" : "en-US", {
            'weekday': "long",
            'year': 'numeric',
            'month': 'long',
            'day': 'numeric'
          });
          const _0x2db7c0 = _0x294b1f.replace(/ |,/ig, '');
          if (!document.getElementById(_0x2db7c0)) {
            _0x4a4f2f.insertAdjacentHTML("beforeend", "\n              <div class=\"msg_time_division\" id=\"" + _0x2db7c0 + "\">\n                <div class=\"line\"></div>\n                <span class=\"time_division\">" + _0x294b1f + "</span>\n                <div class=\"line\"></div>\n              </div>\n            ");
          }
          _0x4a4f2f.insertAdjacentHTML("beforeend", "\n            <div class=\"message\">\n              <div class=\"message_sender\">\n                <span class=\"" + (_0x55f90a ? _0x16fd5 : "my_account") + "\">" + (_0x55f90a ? _0x18c995.render_player_name + " " : _0x3a50f2 + " ") + "</span>\n                <span class=\"message_time\">" + _0x204b5c + "</span>\n              </div>\n              <p class=\"" + (_0x55f90a ? _0x16fd5 : "my_message") + "\">" + (_0x576faf.message.search(/\.jpg|\.png|steamuserimages|steamusercontent/i) !== -0x1 ? "<img class=\"steamImage\"  src=" + _0x576faf.message + "></img>" : _0x576faf.message.replace(/(\r\n|\r|\n)/g, '<br>')) + "</p>\n            </div>\n          ");
        } catch (err: unknown) {
          swal("Error", '' + err, "error");
        }
      });
    };
    _0x546d94.focus();
    if (!Array.isArray(_0x18c995.message_history)) {
      this.get_messages(_0x5c6618).then(_0x60b042 => {
        _0x2d7520(_0x60b042);
        _0x4a4f2f.scrollTop = _0x4a4f2f.scrollHeight;
      });
    } else {
      _0x2d7520(_0x18c995.message_history);
    }
    this.client.chat.ackFriendMessage(_0x5c6618, new Date());
    this.read_message(_0x5c6618);
    this.update_account_messages_counter();
    if (process.templates && process.templates.length > 0) {
      document.querySelector(".chat_footer").insertAdjacentHTML("beforeend", "<div class=\"chat_footer_down chat_footer_down_" + _0x5c6618 + "\"></div>");
      process.templates.forEach(_0xfc95d5 => {
        document.querySelector(".chat_footer_down_" + _0x5c6618).insertAdjacentHTML("beforeend", "<button id=\"template_name_" + _0xfc95d5.name + "\" class='btn'>" + _0xfc95d5.name + "</button>");
        const _0x45dc61 = document.getElementById("template_name_" + _0xfc95d5.name);
        _0x45dc61.onclick = _0x94aa87 => {
          if (!process.settings.paste_template) {
            this.typing_template(_0x5c6618, true, _0xfc95d5.name);
            this.send_message_by_message(_0xfc95d5.messages, _0x5c6618, _0xfc95d5.link);
          } else {
            _0x546d94.value = _0xfc95d5.messages.join("\n").trim();
            _0x546d94.focus();
            this.client.chat.sendFriendTyping(_0x5c6618);
          }
        };
        _0x45dc61.oncontextmenu = () => {
          let _0x4be41e = _0xfc95d5.messages.join("\n").trim();
          if (_0x4be41e.search(/template_username/i) !== -0x1) {
            _0x4be41e = _0x4be41e.replace(/template_username/ig, this.users[_0x5c6618].player_name ? this.users[_0x5c6618].player_name : '');
          }
          const _0x26fa40 = /template_dearest_item_\d+/;
          if (_0x4be41e.search(_0x26fa40) !== -0x1) {
            const [_0x562a81] = _0x4be41e.match(_0x26fa40);
            const [_0xc7eefe] = _0x562a81.match(/\d+/);
            const _0x326543 = this.users[_0x5c6618];
            const _0x4a4433 = _0x326543?.["inventory"][_0xc7eefe]?.["expensive_item"];
            _0x4be41e = _0x4be41e.replace(_0x26fa40, _0x4a4433?.["name"] || '');
          }
          _0x4be41e = process.helper.replaceTemplateDomains(_0x4be41e, process.domainTemplates);
          const _0x2b766b = _0x4be41e.match(/template_invite_link/i);
          if (_0x2b766b) {
            _0x4be41e = _0x4be41e.replace(_0x2b766b, this.invite_link ? this.invite_link : '');
          }
          _0x546d94.value = _0x4be41e;
          _0x546d94.focus();
          this.client.chat.sendFriendTyping(_0x5c6618);
        };
        if (_0xfc95d5.color) {
          _0x45dc61.style.background = _0xfc95d5.color;
        }
      });
    }
    _0x4a4f2f.scrollTop = _0x4a4f2f.scrollHeight;
    if (document.getElementById("friendsModal").scrollTop >= process.settings.friends_area_offset) {
      _0x594de9.classList.add("scrolled");
    }
    _0x546d94.onkeypress = () => this.send_message(event, _0x5c6618);
    _0x546d94.onpaste = () => this.paste_message(_0x5c6618);
    _0x546d94.ondrop = _0x21360c => {
      _0x21360c.preventDefault();
      const _0x38712e = _0x21360c.dataTransfer.files[0];
      if (_0x38712e.type.search(/image/i) !== -0x1) {
        const _0x296f9c = fs.readFileSync(_0x38712e.path);
        this.paste_message(_0x5c6618, _0x296f9c);
      } else {
        swal('Error', process.languages[process.settings.language].upload_only_images, 'error');
      }
      return false;
    };
    document.querySelector(".my_account").onclick = _0xe65136 => process.helper.show_user_actions_list(_0xe65136, _0x3a50f2, null, "header_content_menu");
    document.getElementById('button_' + _0x5c6618).onclick = () => this.send_message(event, _0x5c6618);
    document.getElementById("emotions_" + _0x5c6618).onclick = _0xe9400 => this.print_emotions(_0xe9400, _0x5c6618);
    document.getElementById("chat_delete_friend").onclick = () => this.delete_friend(_0x5c6618);
    document.getElementById('chat_block_friend').onclick = () => this.delete_friend(_0x5c6618, "block");
    document.getElementById("chat_block_delete_friend").onclick = () => this.delete_friend(_0x5c6618, 'block_delete');
    document.getElementById("remove_chat").onclick = () => this.remove_chat();
    document.getElementById('chat_avatar_user_actions_list').onclick = _0x3e8312 => process.helper.show_user_actions_list(_0x3e8312, _0x3a50f2, _0x5c6618);
    _0x33cce3.onclick = () => _0x33cce3.innerText = '';
    _0x33cce3.onblur = () => {
      const _0x325ea7 = _0x33cce3.innerText.trim();
      if (_0x325ea7 !== '' && _0x325ea7 !== _0x18c995.player_name) {
        this.new_name(_0x5c6618, _0x325ea7);
      } else {
        _0x33cce3.innerText = _0x18c995.render_player_name;
      }
    };
    const _0x22cb3c = this.unsend_messages[_0x5c6618];
    if (_0x22cb3c) {
      _0x546d94.value = _0x22cb3c;
    }
    if (this.typing_templates[_0x5c6618]) {
      this.typing_template(_0x5c6618, true, this.typing_templates[_0x5c6618].template_name);
    }
    this.light_open_chat(_0x5c6618);
    const _0x391004 = document.querySelector(".prices");
    process.selected_games.forEach(_0x497d3a => {
      _0x391004.insertAdjacentHTML("beforeend", "\n        <div class=\"price_block price_block_" + _0x497d3a + " " + (_0x18c995.inventory[_0x497d3a] && _0x18c995.inventory[_0x497d3a].inventory_price !== "unchecked" ? '' : 'hide') + "\">\n          <span class=\"tooltip hours_tooltip_" + _0x497d3a + "\">\n            <img src=\"./img/" + _0x497d3a + ".jpg\"/>\n            <span class=\"tooltiptext hours_tooltiptext_" + _0x497d3a + "\">\n              <div class=\"hours_info hours_info_" + _0x497d3a + "\">No info about user activity</div>\n              <div class=\"expensive_item expensive_item_" + _0x497d3a + "\"></div>\n            </span>\n          </span>\n          <span class=\"price_text\" id=\"" + _0x497d3a + "_price\">" + (_0x18c995.inventory[_0x497d3a] ? _0x18c995.inventory[_0x497d3a].inventory_price : "0.00") + "</span> $\n          <span id=\"" + _0x497d3a + "_hold_price\" class=\"hold_price " + (_0x18c995.inventory[_0x497d3a] && _0x18c995.inventory[_0x497d3a].inventory_hold_price !== 'unchecked' && _0x18c995.inventory[_0x497d3a].inventory_hold_price !== "0.00" ? '' : "hide") + "\">" + (_0x18c995.inventory[_0x497d3a] ? _0x18c995.inventory[_0x497d3a].inventory_hold_price : "0.00") + " $</span>\n        </div>\n      ");
    });
    if (process.settings.get_user_info) {
      if (_0x30ba3e) {
        this.print_profile_info(_0x5c6618);
      } else {
        await this.profile_info(_0x5c6618);
        this.print_profile_info(_0x5c6618);
      }
    }
    if (_0x3b6bbd) {
      this.print_inventory(_0x5c6618);
    } else {
      process.selected_games.forEach(async _0x5f0163 => {
        await this.inventory(_0x5c6618, _0x5f0163);
        if (_0x18c995.inventory && Object.keys(_0x18c995.inventory).length > 0) {
          this.print_inventory(_0x5c6618);
        }
      });
    }
    if (_0x3bf9bd) {
      this.print_games_info(_0x5c6618);
    } else {
      this.games_info(_0x5c6618, process.selected_games).then(() => {
        this.print_games_info(_0x5c6618);
      });
    }
    if (_0x18c995.trade_hold_info.checked) {
      if (_0x18c995.trade_hold_info.escrow !== 0x0) {
        this.print_trade_hold_info(_0x5c6618);
      }
    } else {
      await this.check_user_trade(_0x5c6618);
      if (_0x18c995 && _0x18c995.trade_hold_info.escrow !== 0x0) {
        this.print_trade_hold_info(_0x5c6618);
      }
    }
  } catch (err: unknown) {
    this.client.getPersonas([_0x5c6618]);
    logger.error("Chat error: " + err + " " + _0x5c6618 + " " + this.account.login);
  }
};
Profile.prototype.remove_chat = function () {
  const _0x5bb48a = document.querySelector(".chat");
  const _0x1fb0a6 = _0x5bb48a.dataset.user_id;
  const _0x3fa2d2 = _0x5bb48a.dataset.login;
  const _0x10679b = document.getElementById('input_' + _0x1fb0a6).value;
  const _0x4317d8 = process.clients[_0x3fa2d2];
  if (_0x4317d8) {
    _0x4317d8.unsend_messages[_0x1fb0a6] = _0x10679b;
  }
  this.disable_light_chat();
  _0x5bb48a.remove();
};
Profile.prototype.get_messages = function (_0x1036a8) {
  return new Promise(_0x55e10e => {
    if (_0x1036a8 === this.clientSteamID64) {
      return _0x55e10e([]);
    }
    this.client.chat.getFriendMessageHistory(_0x1036a8, {
      'maxCount': 1000,
      'wantBbcode': false
    }, (_0x12c157, _0x8d582e) => {
      if (_0x12c157) {
        logger.error(_0x12c157 + " get_messages " + _0x1036a8 + " " + this.account.login);
        return _0x55e10e([]);
      }
      const _0xda03e9 = _0x8d582e.messages.map(_0x48e000 => ({
        'steam_id': _0x48e000.sender.getSteamID64(),
        'message': _0x48e000.message,
        'timestamp': _0x48e000.server_timestamp
      })).reverse();
      const _0x47d19b = this.users[_0x1036a8];
      if (_0x47d19b) {
        const _0x4fa04f = _0x47d19b.message_history?.["length"] || 0x0;
        const _0x540e03 = _0xda03e9.length >= _0x4fa04f ? _0xda03e9 : _0x47d19b.message_history || [];
        this.users[_0x1036a8].message_history = _0x540e03;
        return _0x55e10e(_0x540e03);
      }
      this.users[_0x1036a8] = {
        'message_history': _0xda03e9
      };
      return _0x55e10e(_0xda03e9);
    });
  });
};
Profile.prototype.sendImageToUser = function (_0x57b189, _0x330887) {
  return new Promise(_0x3f2834 => {
    this.community.sendImageToUser(_0x57b189, _0x330887, {}, async (_0x2d006b, _0x5d975b) => {
      if (_0x2d006b) {
        logger.error(this.account.login + " " + _0x2d006b + " sendImageToUser " + _0x57b189);
        if (('' + _0x2d006b).indexOf("Not Logged on") !== -0x1) {
          this.client.webLogOn();
        }
        return _0x3f2834({
          'status': false,
          'error': _0x2d006b
        });
      }
      const _0x1fcb0f = this.users[_0x57b189];
      if (_0x1fcb0f) {
        const _0x5a5649 = {
          'message': _0x5d975b,
          'steam_id': _0x57b189,
          'timestamp': new Date()
        };
        if (Array.isArray(_0x1fcb0f.message_history)) {
          _0x1fcb0f.message_history.push(_0x5a5649);
        } else {
          await this.get_messages(_0x57b189);
        }
        const _0x189afd = process.helper.pretty_time(new Date());
        const _0x3966e3 = document.querySelector(".chat_body_" + this.account.login + '_' + _0x57b189);
        if (_0x3966e3) {
          _0x3966e3.insertAdjacentHTML("beforeend", "\n          <div class=\"message\">\n            <div class=\"message_sender\">\n              <span class=\"my_account\">" + this.account.login + "</span>\n              <span class=\"message_time\">" + _0x189afd + "</span>\n            </div>\n            <p class='my_message'><img class=\"steamImage\" src=\"data:image/jpeg;base64," + _0x330887.toString("base64") + "\"></img></p>\n          </div>");
          _0x3966e3.scrollTop = _0x3966e3.scrollHeight;
          const _0x1dcedf = document.querySelector(".chat_image_upload");
          if (_0x1dcedf) {
            _0x1dcedf.remove();
          }
        }
      }
      return _0x3f2834({
        'status': true,
        'url': _0x5d975b
      });
    });
  });
};
Profile.prototype.send_message = function (_0x1e6800, _0x3eb76f, _0x444259 = false, _0x409024, _0xf57ca1 = false) {
  return new Promise(_0x3b9236 => {
    try {
      if (this.users[_0x3eb76f]) {
        this.client.chat.sendFriendTyping(_0x3eb76f);
        let _0x42e9f7;
        if (_0x1e6800.type === "keypress" && _0x1e6800.keyCode === 0xd && !_0x1e6800.shiftKey || _0x1e6800.type === "click") {
          if (_0x1e6800.type === "keypress" && _0x1e6800.keyCode === 0xd && !_0x1e6800.shiftKey) {
            _0x1e6800.preventDefault();
          }
          const _0x1ac850 = document.getElementById("input_" + _0x3eb76f);
          let _0x50e8e5 = _0x444259 ? _0x409024 : _0x1ac850.value.trim();
          if (_0x50e8e5 !== '') {
            if (!_0x444259) {
              _0x1ac850.value = '';
            } else {
              if (_0x50e8e5.search(/template_username/i) !== -0x1) {
                _0x50e8e5 = _0x50e8e5.replace(/template_username/ig, this.users[_0x3eb76f].player_name ? this.users[_0x3eb76f].player_name : '');
              }
              const _0x123d8f = /template_dearest_item_\d+/;
              if (_0x50e8e5.search(_0x123d8f) !== -0x1) {
                const [_0x137461] = _0x50e8e5.match(_0x123d8f);
                const [_0x11bb25] = _0x137461.match(/\d+/);
                const _0x59e0b3 = this.users[_0x3eb76f];
                const _0x22704d = _0x59e0b3?.["inventory"][_0x11bb25]?.['expensive_item'];
                _0x50e8e5 = _0x50e8e5.replace(_0x123d8f, _0x22704d?.["name"] || '');
              }
              _0x42e9f7 = setInterval(() => this.client.chat.sendFriendTyping(_0x3eb76f), 10000);
            }
            const _0x1b1a19 = process.helper.pretty_time(new Date());
            const _0x12fe4e = this.account.login;
            const _0x2f7753 = setTimeout(async () => {
              const _0x52e813 = _0x50e8e5.split("template_image=");
              if (_0x52e813.length === 0x2) {
                clearInterval(_0x42e9f7);
                this.typing_template(_0x3eb76f, false);
                const _0x3904e6 = fs.readFileSync(_0x52e813[0x1].trim());
                if (_0x3904e6) {
                  await this.sendImageToUser(_0x3eb76f, _0x3904e6);
                }
                _0x3b9236(true);
              } else {
                this.client.chat.sendFriendMessage(_0x3eb76f, _0x50e8e5, {
                  'containsBbCode': true
                }, async (_0x7f0128, _0x2142c2) => {
                  if (!_0x444259) {
                    delete this.unsend_messages[_0x3eb76f];
                  } else {
                    clearInterval(_0x42e9f7);
                    this.typing_template(_0x3eb76f, false);
                  }
                  const _0x3717f7 = document.querySelector('.chat_body_' + _0x12fe4e + '_' + _0x3eb76f);
                  const _0x38f3e0 = !(!_0x7f0128 && _0x2142c2.server_timestamp !== null);
                  let _0x49afd4 = false;
                  if (!this.users[_0x3eb76f]) {
                    logger.info("User " + _0x3eb76f + " not found on " + this.account.login + " send_message");
                    return;
                  }
                  if (!_0x38f3e0) {
                    _0x49afd4 = !(_0x2142c2.modified_message.search(/link removed/i) == -0x1);
                    const _0x29398a = {
                      'message': _0x50e8e5,
                      'steam_id': this.clientSteamID64,
                      'timestamp': new Date()
                    };
                    if (Array.isArray(this.users[_0x3eb76f].message_history)) {
                      this.users[_0x3eb76f].message_history.push(_0x29398a);
                    } else {
                      await this.get_messages(_0x3eb76f);
                    }
                  } else {
                    logger.error(this.account.login + " send_message " + _0x7f0128 + " " + _0x3eb76f);
                  }
                  if (_0x3717f7) {
                    _0x3717f7.insertAdjacentHTML("beforeend", "\n                    <div class=\"message\">\n                      <div class=\"message_sender\">\n                        <span class=\"my_account\">" + _0x12fe4e + "</span>\n                        <span class=\"message_time\">" + _0x1b1a19 + "</span>\n                      </div>\n                      <p class='" + (!_0x38f3e0 && !_0x49afd4 ? '' : 'red') + " my_message'>" + (!_0x38f3e0 ? _0x50e8e5.search(/\.jpg|\.png|steamuserimages|steamusercontent/i) !== -0x1 ? "<img class=\"steamImage\"  src=" + _0x50e8e5 + "></img>" : (_0x49afd4 ? "{LINK REMOVED}" : '') + " " + _0x50e8e5.replace(/(\r\n|\r|\n)/g, "<br>") : '' + _0x7f0128) + "</p>\n                    </div>\n                  ");
                    _0x3717f7.scrollTop = _0x3717f7.scrollHeight;
                  }
                  this.read_message(_0x3eb76f);
                  this.update_account_messages_counter();
                  _0x3b9236(true);
                });
              }
            }, _0x444259 && !_0xf57ca1 ? process.settings.auto_template_timeout ? process.helper.template_timeout(_0x409024) : 0xfa0 : 0x0);
            if (_0x444259 && this.typing_templates[_0x3eb76f]) {
              this.typing_templates[_0x3eb76f].timeout = _0x2f7753;
              this.typing_templates[_0x3eb76f].interval = _0x42e9f7;
            }
          }
        }
      }
    } catch (err: unknown) {
      logger.error("send_message " + err);
    }
  });
};
Profile.prototype.friend_typing = function (_0x2941ce) {
  const _0x21589e = this.account.login;
  const _0x468148 = document.querySelector(".chat_footer_type_" + _0x21589e + '_' + _0x2941ce);
  if (_0x468148) {
    _0x468148.style.display = "block";
    document.querySelector(".chat_body").scrollTop += 20;
    setTimeout(() => _0x468148.style.display = "none", 6000);
  }
};
Profile.prototype.friend_message = async function (_0x11240e) {
  try {
    const _0x3b5cfc = _0x11240e.steamid_friend.getSteamID64();
    const _0x5535ec = this.users[_0x3b5cfc] || {};
    const _0x47e522 = this.account.login;
    if (!this.users[_0x3b5cfc]) {
      logger.info("New friend " + _0x3b5cfc + " not found on " + this.account.login + " receieve friend_message.");
      return;
    }
    const _0x44cc6b = {
      'message': _0x11240e.message_no_bbcode,
      'steam_id': _0x3b5cfc,
      'timestamp': new Date()
    };
    if (Array.isArray(_0x5535ec.message_history)) {
      _0x5535ec.message_history.push(_0x44cc6b);
    } else {
      await this.get_messages(_0x3b5cfc);
    }
    if (!this.muted[_0x3b5cfc]) {
      if (process.settings.sound) {
        process.player.play();
      }
      const _0xf5dc18 = process.helper.pretty_time(new Date());
      const _0x2d84c1 = _0x5535ec.gameid !== '0' ? "In-game" : online_states[_0x5535ec.persona_state];
      const _0x5d7c39 = document.querySelector(".chat_body_" + _0x47e522 + '_' + _0x3b5cfc);
      if (_0x5d7c39) {
        const _0x1000dc = document.querySelector(".chat_footer_type_" + _0x47e522 + '_' + _0x3b5cfc);
        _0x1000dc.style.display = "none";
        _0x5d7c39.insertAdjacentHTML("beforeend", "\n        <div class=\"message\">\n          <div class=\"message_sender\">\n            <span class=\"" + _0x2d84c1 + "\">" + _0x5535ec.render_player_name + "</span>\n            <span class=\"message_time\">" + _0xf5dc18 + "</span>\n          </div>\n          <p>" + (_0x11240e.message_no_bbcode.search(/\.jpg|\.png|steamuserimages|steamusercontent/i) !== -0x1 ? "<img class=\"steamImage\" alt=\"" + _0x11240e.message_no_bbcode + "\" src=" + _0x11240e.message_no_bbcode + "></img>" : _0x11240e.message_no_bbcode.replace(/(\r\n|\r|\n)/g, '<br>')) + "</p>\n        </div>\n      ");
        _0x5d7c39.scrollTop = _0x5d7c39.scrollHeight;
      } else if (this.unread_messages[_0x3b5cfc]) {
        ++this.unread_messages[_0x3b5cfc];
      } else {
        this.unread_messages[_0x3b5cfc] = 0x1;
      }
      this.update_account_messages_counter();
      if (process.settings.pin_top_on_new_message) {
        this.unpin(_0x3b5cfc);
        this.print_user(_0x3b5cfc, "pin", "top");
      } else {
        this.print_user(_0x3b5cfc, "pin");
      }
      process.helper.notificate("New message", _0x5535ec.render_player_name + " sent message to " + _0x47e522, {
        'type': "message",
        'user_id': _0x3b5cfc,
        'login': _0x47e522
      });
    }
  } catch (err: unknown) {
    logger.error("friend_message " + err);
  }
};
Profile.prototype.spam_account = function (_0x1a5261, _0x33e934, _0x1235f4) {
  return new Promise(_0x406662 => {
    let _0x3bdaa7 = 0x0;
    for (const _0x361faa in this.users) {
      const _0x343c8a = this.users[_0x361faa].persona_state;
      if (this.myFriends[_0x361faa] == 0x3) {
        if (!this.muted[_0x361faa] && (!_0x33e934 || _0x33e934 && !this.spammed[_0x361faa]) && (_0x1a5261.all || _0x1a5261[_0x343c8a]) && (_0x1235f4 !== "spam_pinned" || _0x1235f4 === "spam_pinned" && this.pinned[_0x361faa])) {
          const _0x241240 = setTimeout(() => {
            delete process.action_timeouts.spam_all[_0x241240];
            this.spammed[_0x361faa] = 0x1;
            const _0x5c613c = process.settings.spam_all_message.split(';').filter(_0x3f92cc => _0x3f92cc !== '');
            const _0x8083ea = _0x5c613c[process.helper.random(_0x5c613c.length - 0x1, 0x0)].trim();
            this.send_message_by_message(_0x8083ea.split('|'), _0x361faa);
          }, _0x3bdaa7 * 8000);
          process.action_timeouts.spam_all[_0x241240] = 0x1;
          ++_0x3bdaa7;
        }
      }
    }
    const _0x45eef6 = setTimeout(() => {
      for (const _0xb3a979 in this.spammed) {
        if (!this.old_friends[_0xb3a979]) {
          delete this.spammed[_0xb3a979];
        }
      }
      localStorage.setItem(this.account.login + "_spammed", JSON.stringify(this.spammed));
      delete process.action_timeouts.spam_all[_0x45eef6];
      _0x406662();
    }, _0x3bdaa7 * 8000);
    process.action_timeouts.spam_all[_0x45eef6] = 0x1;
  });
};
Profile.prototype.get_unread_messages = async function () {
  try {
    const _0x61fd4e = setTimeout(() => this.get_unread_messages(), 30000);
    const _0x3b25d5 = await this.client.chat.getActiveFriendMessageSessions();
    clearTimeout(_0x61fd4e);
    _0x3b25d5.sessions.forEach(_0x37855d => {
      const _0x11f3fa = _0x37855d.steamid_friend.getSteamID64();
      const _0x15a177 = this.myFriends[_0x11f3fa];
      if (_0x15a177 && _0x15a177 == 0x3) {
        this.unread_messages[_0x11f3fa] = _0x37855d.unread_message_count;
      }
    });
    this.update_account_messages_counter();
    this.update_user_message_counter();
  } catch (err: unknown) {
    logger.error("get_unread_messages " + err);
    return null;
  }
};
Profile.prototype.update_account_messages_counter = function () {
  let _0x11d20f = 0x0;
  for (const _0x7a404c in this.unread_messages) _0x11d20f += this.unread_messages[_0x7a404c];
  const _0x50e26c = document.querySelector(".message_counter_" + this.account.login);
  if (_0x50e26c) {
    _0x50e26c.innerText = _0x11d20f;
    if (_0x11d20f !== 0x0) {
      _0x50e26c.classList.remove('hide');
    } else {
      _0x50e26c.classList.add("hide");
    }
  }
};
Profile.prototype.update_user_message_counter = function () {
  for (const _0x19e54f in this.users) {
    const _0x1669bb = this.unread_messages[_0x19e54f];
    if (_0x1669bb && _0x1669bb > 0x0 && this.myFriends[_0x19e54f] === 0x3) {
      if (process.settings.auto_pin_unread_messages) {
        this.pinned[_0x19e54f] = 0x1;
        this.print_user(_0x19e54f, "pin");
      }
      const _0x1ed87b = document.querySelector(".message_counter_" + _0x19e54f + '_' + this.account.login);
      if (_0x1ed87b) {
        _0x1ed87b.innerText = _0x1669bb;
        _0x1ed87b.classList.remove("hide");
      }
    }
  }
  if (process.settings.save_deleted_friends) {
    for (const _0x4a3736 in this.deleted_friends) {
      const _0x585980 = this.unread_messages[_0x4a3736];
      if (_0x585980 && _0x585980 > 0x0) {
        const _0x34b3ac = document.querySelector(".message_counter_" + _0x4a3736 + '_' + this.account.login);
        if (_0x34b3ac) {
          _0x34b3ac.innerText = _0x585980;
          _0x34b3ac.classList.remove("hide");
        }
      }
    }
  }
};
Profile.prototype.read_message = function (_0x2b9078) {
  delete this.unread_messages[_0x2b9078];
  const _0x27c699 = document.querySelectorAll(".message_counter_" + _0x2b9078 + '_' + this.account.login);
  for (let _0x35312f = 0x0; _0x35312f < _0x27c699.length; _0x35312f++) {
    _0x27c699[_0x35312f].innerText = 0x0;
    _0x27c699[_0x35312f].classList.add("hide");
  }
};
Profile.prototype.send_message_by_message = async function (_0x11e11d, _0x3b8bd9, _0x1aa46d = false, _0x16c0d4 = 0x0) {
  if (_0x16c0d4 < _0x11e11d.length) {
    let _0x5ccf90 = _0x11e11d[_0x16c0d4];
    _0x5ccf90 = process.helper.replaceTemplateDomains(_0x5ccf90, process.domainTemplates);
    const _0x4bb1a3 = _0x5ccf90.match(/template_invite_link/i);
    if (_0x4bb1a3) {
      _0x5ccf90 = _0x5ccf90.replace(_0x4bb1a3, this.invite_link ? this.invite_link : '');
    }
    await this.send_message({
      'type': "click"
    }, _0x3b8bd9, true, _0x5ccf90, _0x1aa46d);
    return this.send_message_by_message(_0x11e11d, _0x3b8bd9, _0x1aa46d, ++_0x16c0d4);
  } else {
    return;
  }
};
Profile.prototype.light_open_chat = function (_0x1e42bd) {
  this.disable_light_chat();
  const _0x19e13a = document.querySelectorAll('.row_user_' + _0x1e42bd + '_' + this.account.login);
  for (let _0x554189 = 0x0; _0x554189 < _0x19e13a.length; _0x554189++) {
    _0x19e13a[_0x554189].classList.add("open_chat");
  }
  process.open_chat = {
    [this.account.login]: _0x1e42bd
  };
};
Profile.prototype.disable_light_chat = function (_0x285c81) {
  process.open_chat = null;
  const _0x4448e1 = document.querySelectorAll(".row_user.open_chat");
  for (let _0x200901 = 0x0; _0x200901 < _0x4448e1.length; _0x200901++) {
    _0x4448e1[_0x200901].classList.remove("open_chat");
  }
};
Profile.prototype.typing_template = function (_0x2cce7d, _0x3293f1, _0x4f3c45) {
  const _0x345aec = document.querySelector(".typing_template_" + _0x2cce7d);
  if (_0x3293f1) {
    this.typing_templates[_0x2cce7d] = {
      ...this.typing_templates[_0x2cce7d],
      'template_name': _0x4f3c45
    };
    this.typing_templates[_0x2cce7d] = this.typing_templates[_0x2cce7d] ? {
      ...this.typing_templates[_0x2cce7d],
      'template_name': _0x4f3c45
    } : {
      'template_name': _0x4f3c45
    };
    if (_0x345aec) {
      _0x345aec.innerHTML = "\n        <span>You're typing template " + _0x4f3c45 + " ...</span>\n        <span class=\"stop_typing\">Stop typing</span>\n      ";
      document.querySelector('.stop_typing').onclick = () => this.event_emitter.emit("stop_typing", _0x2cce7d);
    }
  } else {
    delete this.typing_templates[_0x2cce7d];
    if (_0x345aec) {
      _0x345aec.innerHTML = '';
    }
  }
};
Profile.prototype.paste_message = function (_0x145584, _0x247130) {
  this.client.chat.sendFriendTyping(_0x145584);
  const _0x5132e0 = _0x247130 ? _0x247130 : process.clipboard.readImage().toJPEG(0x64);
  if (_0x5132e0.length > 0x0) {
    const _0x3dd2ed = document.querySelector('.chat_image_upload');
    if (!_0x3dd2ed) {
      document.querySelector(".chat_footer_up").insertAdjacentHTML("beforeend", "\n      <div class=\"chat_image_upload\">\n        <img id=\"image_upload_preview\" src=\"data:image/jpeg;base64," + _0x5132e0.toString("base64") + "\" alt=\"image\">\n        <div class=\"chat_image_upload_cancel\">\n          <svg version=\"1.1\" id=\"Layer_2\" xmlns=\"http://www.w3.org/2000/svg\" class=\"SVGIcon_Button SVGIcon_X_Line\" x=\"0px\" y=\"0px\" width=\"256px\" height=\"256px\" viewBox=\"0 0 256 256\"><line fill=\"none\" stroke=\"#ffffff\" stroke-width=\"45\" stroke-miterlimit=\"10\" x1=\"212\" y1=\"212\" x2=\"44\" y2=\"44\"></line><line fill=\"none\" stroke=\"#ffffff\" stroke-width=\"45\" stroke-miterlimit=\"10\" x1=\"44\" y1=\"212\" x2=\"212\" y2=\"44\"></line></svg>\n        </div>\n        <button id=\"image_upload\">Upload</button>\n      </div>\n    ");
    }
    document.querySelector(".chat_image_upload_cancel").onclick = () => document.querySelector(".chat_image_upload").remove();
    document.getElementById("image_upload").onclick = async () => {
      const _0x48e706 = await this.sendImageToUser(_0x145584, _0x5132e0);
      if (!_0x48e706.status) {
        swal("Error", "Uploading image error: " + _0x48e706.error, "error");
      }
    };
  }
};
Profile.prototype.get_emotions = function () {
  this.client.getEmoticonList((_0x389999, _0x50ce82) => {
    if (!_0x389999) {
      this.emotions = _0x50ce82.emoticons;
    }
  });
};
Profile.prototype.pin_without_messages = async function (_0x100f93) {
  const _0x1982f7 = this.getSteamidsByOnlineStates(_0x100f93);
  for (let _0x12da3b = 0x0; _0x12da3b < _0x1982f7.length; _0x12da3b++) {
    try {
      const _0x420fa8 = _0x1982f7[_0x12da3b];
      const _0x112905 = this.users[_0x420fa8];
      if (Array.isArray(_0x112905.message_history)) {
        if (_0x112905.message_history.length == 0x0) {
          this.print_user(_0x420fa8, 'pin');
        }
      } else {
        const _0x42b115 = await this.get_messages(_0x420fa8);
        if (_0x42b115.length == 0x0) {
          this.print_user(_0x420fa8, "pin");
        }
      }
    } catch (err: unknown) {
      logger.error("pin_without_messages " + err);
    }
  }
};