import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Order — R0cketShip", robots: { index: false } };

const OR = "#FF7A18";
const fieldStyle: React.CSSProperties = { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #33261a", background: "#120d08", color: "#fff", fontSize: 15, marginTop: 6 };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#c9a98c" };

const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

export default async function RocketshipOrder({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const sp = await searchParams;
  const service = sp.service || "";

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "-apple-system,Helvetica Neue,Arial,sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-.5px" }}>R0cket<span style={{ color: OR }}>Ship</span> 🚀</div>
          <div style={{ fontSize: 12, letterSpacing: "3px", textTransform: "uppercase", color: "#8a7360", marginTop: 2 }}>Demand Engine</div>
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 800, textAlign: "center", margin: "18px 0 4px" }}>Order Now</h1>
        <p style={{ textAlign: "center", color: "#a99987", marginBottom: 22 }}>Tell us where you are and where you want to go — our team will be back with you shortly.</p>

        {service && (
          <div style={{ background: "rgba(255,122,24,.12)", border: `1px solid ${OR}55`, borderRadius: 12, padding: "12px 16px", marginBottom: 20, textAlign: "center" }}>
            <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "#c9a98c" }}>You&rsquo;re ordering</span>
            <div style={{ fontSize: 18, fontWeight: 800, color: OR }}>{service}</div>
          </div>
        )}

        <form action="/api/rocketship/order" method="post">
          <input type="hidden" name="service" value={service} />
          <input type="text" name="website" tabIndex={-1} autoComplete="off" style={{ position: "absolute", left: "-9999px" }} aria-hidden />

          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
            <label style={labelStyle}>First name<input required name="firstName" style={fieldStyle} /></label>
            <label style={labelStyle}>Last name<input required name="lastName" style={fieldStyle} /></label>
            <label style={labelStyle}>Phone number<input required name="phone" type="tel" style={fieldStyle} /></label>
            <label style={labelStyle}>Name of business<input name="business" style={fieldStyle} /></label>
            <label style={labelStyle}>City<input name="city" style={fieldStyle} /></label>
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
              <label style={labelStyle}>State<select name="state" defaultValue="" style={fieldStyle}><option value="">—</option>{STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
              <label style={labelStyle}>Zip<input name="zip" inputMode="numeric" style={fieldStyle} /></label>
            </div>
            <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>Timeframe you&rsquo;d like to start
              <select name="timeframe" defaultValue="" style={fieldStyle}>
                <option value="">Select a timeframe…</option>
                <option>Next 30 days</option>
                <option>Within 3 months</option>
                <option>This year</option>
                <option>Just exploring</option>
              </select>
            </label>
            <label style={labelStyle}>Estimated annual marketing spend<input name="annualSpend" placeholder="$" style={fieldStyle} /></label>
            <label style={labelStyle}>Cost per new customer (avg)<input name="cpa" placeholder="$" style={fieldStyle} /></label>
            <label style={labelStyle}>Customers you have now<input name="currentCustomers" inputMode="numeric" style={fieldStyle} /></label>
            <label style={labelStyle}>Customers you want to scale to<input name="scaleTo" inputMode="numeric" style={fieldStyle} /></label>
          </div>

          <button type="submit" style={{ width: "100%", marginTop: 26, padding: "16px", borderRadius: 12, border: "none", background: OR, color: "#0a0a0a", fontSize: 18, fontWeight: 900, cursor: "pointer", letterSpacing: ".02em" }}>
            Submit Order →
          </button>
          <p style={{ textAlign: "center", color: "#6b5a48", fontSize: 12, marginTop: 12 }}>By submitting you agree we may contact you about your request. R0cketShip.com</p>
        </form>
      </div>
    </div>
  );
}
