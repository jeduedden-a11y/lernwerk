#!/bin/bash
# Boots a simulator, installs the demo build and captures the main screens and a few lessons: the iPhone in
# dark and light mode, or (fourth argument "ipad") the iPad. Every simulator call has its own time limit and
# the whole run a budget (seconds, third argument), so a slow or stuck simulator costs screenshots, never the
# build. Same approach as in Tagwerk.
set -uo pipefail
APP="$1"
OUT="${2:-shots}"
BUDGET="${3:-1500}"
DEVICE="${4:-iphone}"
START=$SECONDS
BUNDLE_ID="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$APP/Info.plist")"
LANG_ARGS=(-AppleLanguages "(de)" -AppleLocale de_DE)
mkdir -p "$OUT"

# Runs a command with a time limit (macOS has no timeout(1); the alarm survives exec).
limit() {
  local seconds="$1"
  shift
  perl -e 'alarm shift; exec @ARGV' "$seconds" "$@"
}

left() { echo $((BUDGET - (SECONDS - START))); }

boot() {
  local udid="$1" wait="${2:-900}"
  [ "$wait" -gt 30 ] || return 1
  limit 60 xcrun simctl boot "$udid" 2>/dev/null || true
  limit "$wait" xcrun simctl bootstatus "$udid" -b >/dev/null || return 1
  limit 30 xcrun simctl status_bar "$udid" override --time "9:41" --batteryState charged --batteryLevel 100 --wifiBars 3 --cellularBars 4 >/dev/null 2>&1 || true
  limit 300 xcrun simctl install "$udid" "$APP" || return 1
  # Right after boot the simulator is busy with its own setup and the first launch is slow.
  sleep 15
}

# Launches the demo with the given arguments and captures once the screen has settled: larger than the
# plain launch screen and unchanged between two captures, whatever the runner's speed. Lessons render in a
# web view; the same check waits until their formulas and figures have settled.
shot() {
  local udid="$1" name="$2"
  shift 2
  if [ "$(left)" -lt 45 ]; then
    echo "skipped $name (time budget used up)"
    return 0
  fi
  local file="$OUT/$name.png" prev=0 size diff
  limit 30 xcrun simctl terminate "$udid" "$BUNDLE_ID" >/dev/null 2>&1 || true
  if ! limit 90 xcrun simctl launch "$udid" "$BUNDLE_ID" -LWDemo YES "$@" "${LANG_ARGS[@]}" >/dev/null; then
    echo "warning: launch for $name failed"
    return 0
  fi
  sleep 5
  for _ in 1 2 3 4 5 6 7 8 9 10 11 12; do
    if limit 45 xcrun simctl io "$udid" screenshot "$file" >/dev/null 2>&1; then
      size=$(stat -f%z "$file" 2>/dev/null || echo 0)
      diff=$((size > prev ? size - prev : prev - size))
      if [ "$size" -gt 150000 ] && [ "$diff" -lt $((size / 300)) ]; then
        echo "captured $name ($((SECONDS - START)) s)"
        return 0
      fi
      prev=$size
    fi
    sleep 2
  done
  echo "warning: $name did not settle"
}

lessons() {
  local udid="$1" prefix="$2"
  # Step 0 of every lesson is its film (anim); -LWStep counts from 0.
  shot "$udid" "$prefix-lektion-film" -LWLesson eth-politik
  shot "$udid" "$prefix-lektion-markt" -LWLesson oek-markt -LWStep 2
  shot "$udid" "$prefix-lektion-supremum" -LWLesson ana1-supremum -LWStep 3
  shot "$udid" "$prefix-lektion-labyrinth" -LWLesson cs50-suche -LWStep 5
  shot "$udid" "$prefix-lektion-matrix" -LWLesson la1-matrizen -LWStep 2
  shot "$udid" "$prefix-lektion-kula" -LWLesson eth-gabe -LWStep 2
  shot "$udid" "$prefix-lektion-staat" -LWLesson oek-staat -LWStep 9
  shot "$udid" "$prefix-lektion-epsilon" -LWLesson ana1-konvergenz -LWStep 2
  shot "$udid" "$prefix-lektion-minimax" -LWLesson cs50-minimax -LWStep 2
  shot "$udid" "$prefix-lektion-bayesnetz" -LWLesson cs50-bayesnetze -LWStep 3
  shot "$udid" "$prefix-lektion-generator" -LWLesson ana1-konvergenz -LWStep 14
  shot "$udid" "$prefix-lektion-weltkarte" -LWLesson eth-feldforschung -LWStep 3
  shot "$udid" "$prefix-lektion-beweis" -LWLesson ana1-konvergenz -LWStep 7
  shot "$udid" "$prefix-training-experte" -LWPractice grenzwerte -LWLevel 4
}

iphone_set() {
  local udid="$1" appearance="$2"
  limit 30 xcrun simctl ui "$udid" appearance "$appearance" || true
  for tab in learn review notes stats search; do
    shot "$udid" "$appearance-$tab" -LWTab "$tab"
  done
  shot "$udid" "$appearance-kurs" -LWTab learn -LWCourse analysis-1
  shot "$udid" "$appearance-lernpfad" -LWTab learn -LWPath YES
  shot "$udid" "$appearance-lernpfad-ethnologie" -LWTab learn -LWPath YES -LWSubject ethnologie
  shot "$udid" "$appearance-einstellungen" -LWTab learn -LWSettings YES
  shot "$udid" "$appearance-wiederholung" -LWReview YES
  lessons "$udid" "$appearance"
}

if [ "$DEVICE" = "ipad" ]; then
  IPAD="$(python3 scripts/pick-simulator.py ipad)" || exit 0
  if ! boot "$IPAD"; then
    echo "warning: iPad simulator did not boot"
    exit 0
  fi
  for appearance in dark light; do
    limit 30 xcrun simctl ui "$IPAD" appearance "$appearance" || true
    shot "$IPAD" "ipad-$appearance-learn" -LWTab learn
    shot "$IPAD" "ipad-$appearance-kurs" -LWTab learn -LWCourse oekonomik
    shot "$IPAD" "ipad-$appearance-stats" -LWTab stats
    shot "$IPAD" "ipad-$appearance-lektion-markt" -LWLesson oek-markt -LWStep 2
    shot "$IPAD" "ipad-$appearance-lektion-matrix" -LWLesson la1-matrizen -LWStep 2
    shot "$IPAD" "ipad-$appearance-training" -LWPractice folgen -LWLevel 2
  done
  echo "screenshots done in $((SECONDS - START)) s"
  exit 0
fi

UDID="$(python3 scripts/pick-simulator.py)"
if ! boot "$UDID"; then
  echo "warning: iPhone simulator did not boot"
  exit 0
fi
iphone_set "$UDID" dark
iphone_set "$UDID" light

# First launch without demo data: what a new installation shows.
if [ "$(left)" -gt 45 ]; then
  limit 30 xcrun simctl terminate "$UDID" "$BUNDLE_ID" >/dev/null 2>&1 || true
  limit 90 xcrun simctl launch "$UDID" "$BUNDLE_ID" "${LANG_ARGS[@]}" >/dev/null && sleep 10 &&
    limit 45 xcrun simctl io "$UDID" screenshot "$OUT/light-erststart.png" >/dev/null 2>&1 && echo "captured light-erststart"
fi
echo "screenshots done in $((SECONDS - START)) s"
exit 0
