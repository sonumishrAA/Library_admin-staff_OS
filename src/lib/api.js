const getSupabaseUrl = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) {
    throw new Error("VITE_SUPABASE_URL is not configured");
  }
  return String(url).replace(/\/$/, "");
};

const getSupabaseAnonKey = () => {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error("VITE_SUPABASE_ANON_KEY is not configured");
  }
  return String(key);
};

const buildFunctionUrl = (path, params) => {
  // Always use absolute Supabase URL for reliable header forwarding
  const url = new URL(`${getSupabaseUrl()}/functions/v1/${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
};

async function requestFunction(
  path,
  { method = "GET", body, token, params } = {},
) {
  const headers = {
    "Content-Type": "application/json",
  };

  // Send the anon key in standard headers to pass Supabase Edge Function Gateway
  headers.apikey = getSupabaseAnonKey();
  headers.Authorization = `Bearer ${getSupabaseAnonKey()}`;

  // If we have a custom portal token, send it in x-portal-authorization
  // since the gateway will reject it if placed in the standard Authorization header.
  if (token) {
    headers["x-portal-authorization"] = `Bearer ${token}`;
  }

  const url = buildFunctionUrl(path, params);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    let payload;
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      payload = await response.json();
    } else {
      const text = await response.text();
      payload = { error: text || `HTTP ${response.status}` };
    }

    if (!response.ok) {
      const errorMsg =
        payload?.error || `Request failed with status ${response.status}`;
      console.error(`[API Error] ${path}:`, {
        status: response.status,
        error: errorMsg,
        method,
        url,
        token: token ? `${token.substring(0, 20)}...` : "NO TOKEN",
      });
      console.error(`[API Full Response]:`, payload);
      throw new Error(errorMsg);
    }
    return payload;
  } catch (err) {
    console.error(`[API Exception] ${path}:`, err.message);
    throw err;
  }
}

export const portalApi = {
  login: async (body) => {
    const response = await requestFunction("auth-library-user", {
      method: "POST",
      body,
    });
    console.log("[portalApi.login] Full Response:", response);
    console.log("[portalApi.login] Token Check:", {
      tokenLength: response.token?.length || 0,
      tokenParts: response.token?.split(".").length || 0,
      libraries: response.libraries?.length || 0,
    });
    return response;
  },
  getLibraryContext: (token, libraryId) =>
    requestFunction("get-library-context", {
      token,
      params: { library_id: libraryId },
    }),
  getDashboard: (token, libraryId) =>
    requestFunction("get-ops-dashboard", {
      token,
      params: { library_id: libraryId },
    }),
  createAdmission: (token, body) =>
    requestFunction("create-admission", { method: "POST", token, body }),
  renewMembershipCash: (token, body) =>
    requestFunction("renew-membership-cash", { method: "POST", token, body }),
  changeSeat: (token, body) =>
    requestFunction("change-seat", { method: "POST", token, body }),
  assignLocker: (token, body) =>
    requestFunction("assign-locker", { method: "POST", token, body }),
  manageStaff: (token, body) =>
    requestFunction("manage-staff-user", { method: "POST", token, body }),
  updatePricing: (token, body) =>
    requestFunction("update-library-pricing", { method: "POST", token, body }),
  requestRenewal: (token, body) =>
    requestFunction("request-subscription-renewal", {
      method: "POST",
      token,
      body,
    }),
  getOwnerNotifications: (token, libraryId) =>
    requestFunction("get-owner-notifications", {
      token,
      params: { library_id: libraryId },
    }),
  markOwnerNotificationsRead: (token, body) =>
    requestFunction("mark-owner-notifications-read", {
      method: "POST",
      token,
      body,
    }),
  getPricingPlans: async () => {
    const response = await requestFunction("get-pricing");
    return { plans: response.plans || response.data || [] };
  },
};
