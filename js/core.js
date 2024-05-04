const hypClient = HyPC.eth("https://voiceboard.hypercycle.io", "HyPC Serverless Voiceboard");

const byId = id => document.getElementById(id);
const bySel = selector => document.querySelector(selector);

const sorted = (array) => {
  const res = array.slice().sort();
  return res;
};

const debounce = (func, timeout = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
};

const setup = () => {
  console.log("Getting elements...");
  const txt_text = byId("text");
  const btn_submit = byId("submit");

  const lbl_estimate = byId("aim_estimate");
  const lbl_balance = byId("wallet_balance");

  const inp_tx_val = byId("transaction_value");
  const btn_update_balance = byId("update_balance");

  const chat_history = byId("chat_history");

  const updateEstimate = () => {
    return hypClient.aims().groq.fetchEstimate("predict", {prompt: txt_text.value})
      .then(estimate => lbl_estimate.innerHTML = `Estimate: ${estimate.HyPC.estimated_cost} HyPC`);
  };

  const setBalance = (balance) => {
    const balance_str = `Balance: ${balance} HyPC`;
    lbl_balance.innerHTML = balance_str;
    return balance;
  };

  const updateBalance = () => {
    return hypClient.fetchBalance().then(data => setBalance(data.HyPC || 0));
  };

  btn_update_balance.addEventListener("click", ev => {
    ev.preventDefault();
    return hypClient.sendToNode(parseInt(inp_tx_val.value)).then(updateBalance);
  });

  console.log("Getting initial estimate and balance...");
  hypClient.init()
    .then(_ => updateEstimate())
    .then(_ => updateBalance());

  txt_text.addEventListener("keyup", debounce((ev) => {
    console.log(ev);
    updateEstimate();
  }));

  btn_submit.addEventListener("click", (ev) => {
    ev.preventDefault();
    btn_submit.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>Processing...';
    btn_submit.setAttribute("disabled", "");
    console.log("SUBMIT CLICKED");
    const text = txt_text.value;

    const my_msg = document.createElement("div");
    my_msg.classList.add("card");
    my_msg.classList.add("text-bg-primary");
    my_msg.classList.add("my-2");
    my_msg.innerHTML = `<div class="card-header text-left"><p>You:</p></div><div class="card-body"><p class="card-text text-left">${text}</p></div>`;
    chat_history.prepend(my_msg);

    hypClient.aims().groq.fetchResult("predict", {prompt: text})
      .then(dat => {
        console.log("Returned: ", dat);
	btn_submit.innerHTML = "Send";
	btn_submit.removeAttribute("disabled");
        const resp_msg = document.createElement("div");
        resp_msg.classList.add("card");
        resp_msg.classList.add("text-bg-light");
        resp_msg.classList.add("my-2");
        resp_msg.innerHTML = `<div class="card-header text-left"><p>Groq:</p></div><div class="card-body"><p class="card-text text-left">${dat.response}</p></div>`;
        chat_history.prepend(resp_msg);
        return updateBalance();
      })
      .catch(err => {
        console.log("FAILED", err);
        btn_submit.innerHTML = "Send";
	btn_submit.removeAttribute("disabled");
      });
  });
};

window.addEventListener("DOMContentLoaded", () => {
  console.log("Setting up voiceboard...");
  setup();
});
