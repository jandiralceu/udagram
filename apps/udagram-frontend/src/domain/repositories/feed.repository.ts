import type { Feed, CreateFeedRequest } from '../entities/feed'

export interface IFeedRepository {
  getFeeds(): Promise<Feed[]>
  getFeedById(feedId: string): Promise<Feed>
  createFeed(request: CreateFeedRequest): Promise<void>
  deleteFeed(feedId: string): Promise<void>
}
