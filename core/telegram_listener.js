import { MTProto, getSRPParams } from "@mtproto/core";
import { API_ID, API_HASH } from "../config.js";
import prompts from "prompts";

export class TelegramListener {
  constructor(callback) {
    this.callback = callback;
  }

  async getPhone() {
    return (
      await prompts({
        type: "text",
        name: "phone",
        message: "Enter your phone number:",
      })
    ).phone;
  }

  async getCode() {
    return (
      await prompts({
        type: "text",
        name: "code",
        message: "Enter the code sent:",
      })
    ).code;
  }

  async getPassword() {
    return (
      await prompts({
        type: "text",
        name: "password",
        message: "Enter Password:",
      })
    ).password;
  }

  mtproto = new MTProto({
    api_id: API_ID,
    api_hash: API_HASH,
  });

  startListener() {
    console.log("[+] starting listener");
    this.mtproto.updates.on("updates", ({ updates }) => this.callback(updates));
  }

  init() {
    // checking authentication status
    this.mtproto
      .call("users.getFullUser", {
        id: {
          _: "inputUserSelf",
        },
      })
      .then(this.startListener) // means the user is logged in -> so start the listener
      .catch(async (error) => {
        // The user is not logged in
        console.log("[+] You must log in");
        const phone_number = await this.getPhone();

        this.mtproto
          .call("auth.sendCode", {
            phone_number: phone_number,
            settings: {
              _: "codeSettings",
            },
          })
          .catch((error) => {
            if (error.error_message.includes("_MIGRATE_")) {
              const [type, nextDcId] = error.error_message.split("_MIGRATE_");

              this.mtproto.setDefaultDc(+nextDcId);

              return sendCode(phone_number);
            }
          })
          .then(async (result) => {
            return this.mtproto.call("auth.signIn", {
              phone_code: await this.getCode(),
              phone_number: phone_number,
              phone_code_hash: result.phone_code_hash,
            });
          })
          .catch((error) => {
            if (error.error_message === "SESSION_PASSWORD_NEEDED") {
              return this.mtproto
                .call("account.getPassword")
                .then(async (result) => {
                  const { srp_id, current_algo, srp_B } = result;
                  const { salt1, salt2, g, p } = current_algo;

                  const { A, M1 } = await getSRPParams({
                    g,
                    p,
                    salt1,
                    salt2,
                    gB: srp_B,
                    password: await this.getPassword(),
                  });

                  return this.mtproto.call("auth.checkPassword", {
                    password: {
                      _: "inputCheckPasswordSRP",
                      srp_id,
                      A,
                      M1,
                    },
                  });
                });
            }
          })
          .then((result) => {
            console.log("[+] successfully authenticated");
            // start listener since the user has logged in now
            this.startListener();
          });
      });
  }
}
