export type NotificationSummary = {
  id: string;
  domainId: string;
  domainName: string;
  changeType: string;
  message: string;
  read: boolean;
  sent: boolean;
  createdAt: string;
};

export type CreateNotificationInput = {
  domainId: string;
  changeType: string;
  message?: string;
};
