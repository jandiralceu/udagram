export type Feed = {
  id: string
  caption: string
  imageUrl: string
  userId: string
  userName: string
  userAvatar: string | null
  createdAt: Date
  updatedAt: Date
}

export type CreateFeedRequest = {
  caption: string
  file: File
}
