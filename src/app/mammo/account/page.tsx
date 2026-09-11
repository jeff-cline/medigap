import { redirect } from "next/navigation";

// /account and /schedule were the same page. One canonical URL.
export default function Account() {
  redirect("/schedule");
}
