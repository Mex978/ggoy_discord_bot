import { MTProto, getSRPParams } from "@mtproto/core";
import { API_ID, API_HASH } from "../config.js";
import prompts from "prompts";

async function getPhone() {
  return (
    await prompts({
      type: "text",
      name: "phone",
      message: "Enter your phone number:",
    })
  ).phone;
}

async function getCode() {
  return (
    await prompts({
      type: "text",
      name: "code",
      message: "Enter the code sent:",
    })
  ).code;
}

async function getPassword() {
  return (
    await prompts({
      type: "text",
      name: "password",
      message: "Enter Password:",
    })
  ).password;
}

const mtproto = new MTProto({
  api_id: API_ID,
  api_hash: API_HASH,
});

function startListener(foo) {
  console.log("[+] starting listener");
  mtproto.updates.on("updates", ({ updates }) => foo(updates));
}

export function init(foo) {
  // checking authentication status
  mtproto
    .call("users.getFullUser", {
      id: {
        _: "inputUserSelf",
      },
    })
    .then(startListener(foo)) // means the user is logged in -> so start the listener
    .catch(async (_) => {
      // The user is not logged in
      console.log("[+] You must log in");
      const phone_number = await getPhone();

      mtproto
        .call("auth.sendCode", {
          phone_number: phone_number,
          settings: {
            _: "codeSettings",
          },
        })
        .catch((error) => {
          if (error.error_message.includes("_MIGRATE_")) {
            const [nextDcId] = error.error_message.split("_MIGRATE_");

            mtproto.setDefaultDc(+nextDcId);

            return sendCode(phone_number);
          }
        })
        .then(async (result) => {
          return mtproto.call("auth.signIn", {
            phone_code: await getCode(),
            phone_number: phone_number,
            phone_code_hash: result.phone_code_hash,
          });
        })
        .catch(async (_) => {
          if (error.error_message === "SESSION_PASSWORD_NEEDED") {
            return mtproto.call("account.getPassword").then(async (result) => {
              const { srp_id, current_algo, srp_B } = result;
              const { salt1, salt2, g, p } = current_algo;

              const { A, M1 } = await getSRPParams({
                g,
                p,
                salt1,
                salt2,
                gB: srp_B,
                password: await getPassword(),
              });

              return mtproto.call("auth.checkPassword", {
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
        .then((_) => {
          console.log("[+] successfully authenticated");
          // start listener since the user has logged in now
          startListener(foo);
        });
    });
}
