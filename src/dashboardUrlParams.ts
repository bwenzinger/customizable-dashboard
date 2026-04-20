export const dashboardUrlParamsChangedEventName =
  'demo-dashboard-url-params-changed';

export function subscribeToUrlParamChanges(onStoreChange: () => void) {
  window.addEventListener('popstate', onStoreChange);
  window.addEventListener(
    dashboardUrlParamsChangedEventName,
    onStoreChange
  );

  return () => {
    window.removeEventListener('popstate', onStoreChange);
    window.removeEventListener(
      dashboardUrlParamsChangedEventName,
      onStoreChange
    );
  };
}

export function getUrlSearchSnapshot() {
  return window.location.search;
}

export function getUrlParamValue(
  paramName: string,
  search = getUrlSearchSnapshot()
): string | null {
  if (!paramName) {
    return null;
  }

  return new URLSearchParams(search).get(paramName);
}

export function writeUrlParamValue(paramName: string, value: string) {
  if (!paramName) {
    return;
  }

  const nextUrl = new URL(window.location.href);

  if (value) {
    nextUrl.searchParams.set(paramName, value);
  } else {
    nextUrl.searchParams.delete(paramName);
  }

  commitUrlChange(nextUrl);
}

export function writeRenamedUrlParamValue(
  previousParamName: string,
  nextParamName: string,
  nextValue: string
) {
  if (!previousParamName && !nextParamName) {
    return;
  }

  const nextUrl = new URL(window.location.href);

  if (previousParamName && previousParamName !== nextParamName) {
    nextUrl.searchParams.delete(previousParamName);
  }

  if (nextParamName) {
    if (nextValue) {
      nextUrl.searchParams.set(nextParamName, nextValue);
    } else {
      nextUrl.searchParams.delete(nextParamName);
    }
  } else if (previousParamName) {
    nextUrl.searchParams.delete(previousParamName);
  }

  commitUrlChange(nextUrl);
}

function commitUrlChange(nextUrl: URL) {
  window.history.replaceState(
    window.history.state,
    '',
    `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
  );
  // `replaceState` does not emit `popstate`, so dashboard widgets notify each
  // other explicitly when one of them changes the shared URL params.
  window.dispatchEvent(new Event(dashboardUrlParamsChangedEventName));
}
