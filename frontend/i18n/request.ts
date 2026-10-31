import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  const locale = "id";

  return {
    locale,
    timeZone: "Asia/Jakarta",
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
