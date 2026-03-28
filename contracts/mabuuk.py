# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *

class Mabuuk(gl.Contract):
    owner: Address
    risk_threshold: u256
    error: str
    last_riddle: str

    tx_attempted: TreeMap[str, u256]
    tx_passed: TreeMap[str, u256]
    tx_rejected: TreeMap[str, u256]
    funds_saved: TreeMap[str, u256]

    lock_active: TreeMap[str, str]
    lock_until: TreeMap[str, u256]
    lock_reason: TreeMap[str, str]

    def __init__(self):
        self.owner = gl.message.sender_address
        self.risk_threshold = u256(500)
        self.error = ""
        self.last_riddle = ""

    @gl.public.write
    def generate_riddle(self) -> None:
        def leader_fn():
            return gl.nondet.exec_prompt(
                "Generate 1 short, simple logical riddle that is easy for a sober person. "
                "Do NOT include the answer. Return ONLY the riddle text. Max 2 sentences."
            )

        def validator_fn(leader_result):
            if not isinstance(leader_result, gl.vm.Return):
                return False
            text = leader_result.calldata
            if text is None or len(str(text).strip()) < 10:
                return False
            return True

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        self.last_riddle = str(result)
        self.error = "Riddle generated successfully"

    @gl.public.view
    def get_last_riddle(self) -> str:
        return self.last_riddle

    @gl.public.write
    def execute_transfer(self, destination: str, amount: u256, riddle_asked: str, user_answer: str, current_time: u256) -> None:
        # BUG FIX 1: Normalisasi alamat menjadi huruf kecil agar seragam di semua wallet
        sender = gl.message.sender_address.as_hex.lower()
        dest = destination.lower()

        active = self.lock_active.get(sender)
        if active is not None and active == "True":
            locked_until = self.lock_until.get(sender)
            if locked_until is not None and current_time < locked_until:
                reason = self.lock_reason.get(sender)
                if reason is None:
                    reason = "Wallet locked"
                self.error = "WALLET LOCKED: " + reason
                raise Exception("WALLET LOCKED! " + reason)

        if amount < self.risk_threshold:
            self._record_tx(sender, "PASS", amount)
            self.error = "APPROVED: Low-risk amount, no AI check needed."
            return

        amount_val = int(amount)
        riddle_val = str(riddle_asked)
        answer_val = str(user_answer)

        # BUG FIX 2 & 3: Menggunakan 'dest' di prompt dan membuat prompt sangat biner/ketat
        def leader_fn():
            prompt = (
                "You are an AI protecting a user from drunk or panic crypto transfers.\n"
                "Amount: " + str(amount_val) + " tokens\n"
                "Destination: " + dest + "\n"
                "Riddle asked: '" + riddle_val + "'\n"
                "User answered: '" + answer_val + "'\n\n"
                "Task: If the answer makes logical sense, reply exactly 'PASS'. "
                "If the answer is gibberish, clearly wrong, or shows panic/drunk typing, reply exactly 'FAIL'. "
                "ONLY reply with PASS or FAIL."
            )
            response = gl.nondet.exec_prompt(prompt)
            cleaned = str(response).strip().upper()
            if "FAIL" in cleaned:
                return "FAIL"
            return "PASS"

        def validator_fn(leader_result):
            if not isinstance(leader_result, gl.vm.Return):
                return False
            my_result = leader_fn()
            return leader_result.calldata == my_result

        final_result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        if final_result == "FAIL":
            self._record_tx(sender, "FAIL", amount)
            self.lock_active[sender] = "True"
            self.lock_until[sender] = current_time + u256(14400)
            self.lock_reason[sender] = "AI detected drunk/panic behavior"
            self.error = "REJECTED: AI detected impaired judgment. Wallet locked 4 hours."
        else:
            self._record_tx(sender, "PASS", amount)
            self.error = "APPROVED: User verified as sober."

    def _record_tx(self, user_address: str, status: str, amount: u256) -> None:
        user_address = user_address.lower() # Normalisasi
        attempted = self.tx_attempted.get(user_address)
        if attempted is None: attempted = u256(0)
        
        passed = self.tx_passed.get(user_address)
        if passed is None: passed = u256(0)
            
        rejected = self.tx_rejected.get(user_address)
        if rejected is None: rejected = u256(0)
            
        saved = self.funds_saved.get(user_address)
        if saved is None: saved = u256(0)

        attempted += 1
        if status == "PASS": passed += 1
        elif status == "FAIL":
            rejected += 1
            saved += amount

        self.tx_attempted[user_address] = attempted
        self.tx_passed[user_address] = passed
        self.tx_rejected[user_address] = rejected
        self.funds_saved[user_address] = saved

    @gl.public.view
    def get_user_profile(self, user_address: str) -> dict:
        user_address = user_address.lower() # Normalisasi agar frontend bisa baca
        attempted = self.tx_attempted.get(user_address)
        if attempted is None:
            return {"error": "No transactions yet"}
            
        passed = self.tx_passed.get(user_address)
        if passed is None: passed = u256(0)
            
        rejected = self.tx_rejected.get(user_address)
        if rejected is None: rejected = u256(0)
            
        saved = self.funds_saved.get(user_address)
        if saved is None: saved = u256(0)
            
        return {
            "address": user_address,
            "total_tx_attempted": str(attempted),
            "total_tx_passed": str(passed),
            "total_tx_rejected": str(rejected),
            "total_funds_saved": str(saved)
        }

    @gl.public.view
    def check_lock_status(self, user_address: str, current_time: u256) -> dict:
        user_address = user_address.lower() # Normalisasi
        active = self.lock_active.get(user_address)
        if active is None or active != "True":
            return {"locked": "False"}
            
        locked_until = self.lock_until.get(user_address)
        if locked_until is None:
            return {"locked": "False"}
            
        if current_time >= locked_until:
            return {"locked": "False", "message": "Lock expired"}
            
        reason = self.lock_reason.get(user_address)
        if reason is None: reason = ""
            
        return {
            "locked": "True",
            "locked_until": str(locked_until),
            "reason": reason,
            "time_remaining_sec": str(locked_until - current_time)
        }

    @gl.public.view
    def get_risk_threshold(self) -> u256:
        return self.risk_threshold

    @gl.public.view
    def get_error(self) -> str:
        return self.error