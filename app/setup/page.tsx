import { setupUser } from "@/actions/billings";

async function SetupPage() {
  console.log("in setup page");
  return await setupUser();
}

export default SetupPage;
