"use client";

import { notificationPreferenceOptions } from "@/lib/domain/notification-preferences";
import type { NotificationPreference, NotificationType } from "@/lib/domain/types";

type NotificationPreferencesInputProps = {
  preferences: NotificationPreference[];
  onChange: (preferences: NotificationPreference[]) => void;
};

export function NotificationPreferencesInput({ preferences, onChange }: NotificationPreferencesInputProps) {
  function setPreference(type: NotificationType, enabled: boolean) {
    onChange(
      preferences.map((preference) =>
        preference.type === type ? { ...preference, enabled } : preference,
      ),
    );
  }

  return (
    <fieldset className="space-y-4 rounded-md border border-border bg-background/40 p-4">
      <legend className="px-1 text-sm font-medium">Notifications</legend>
      <div className="grid gap-3 md:grid-cols-2">
        {notificationPreferenceOptions.map((option) => {
          const preference = preferences.find((item) => item.type === option.type);

          return (
            <label
              key={option.type}
              className="flex items-start gap-3 rounded-md border border-border bg-card/50 p-3 text-sm"
            >
              <input
                type="checkbox"
                checked={preference?.enabled ?? false}
                onChange={(event) => setPreference(option.type, event.target.checked)}
                className="mt-0.5 size-4 rounded border-input accent-primary"
              />
              <span>
                <span className="block font-medium text-foreground">{option.label}</span>
                <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{option.detail}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
