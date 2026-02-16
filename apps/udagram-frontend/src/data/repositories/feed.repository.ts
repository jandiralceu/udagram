import type { Feed, CreateFeedRequest } from '@domain/entities'
import type { IFeedRepository } from '@domain/repositories'
import type { IFeedRemoteDataSource } from '../datasources'
import type { FeedModel } from '../models'

export class FeedRepository implements IFeedRepository {
  readonly #remoteDataSource: IFeedRemoteDataSource

  constructor(remoteDataSource: IFeedRemoteDataSource) {
    this.#remoteDataSource = remoteDataSource
  }

  async getFeeds(): Promise<Feed[]> {
    const models = await this.#remoteDataSource.getFeeds()
    return models.map(this.#mapToEntity)
  }

  async getFeedById(feedId: string): Promise<Feed> {
    const model = await this.#remoteDataSource.getFeedById(feedId)
    return this.#mapToEntity(model)
  }

  async createFeed(request: CreateFeedRequest): Promise<void> {
    await this.#remoteDataSource.createFeed(request)
  }

  async deleteFeed(feedId: string): Promise<void> {
    await this.#remoteDataSource.deleteFeed(feedId)
  }

  #mapToEntity(model: FeedModel): Feed {
    return {
      id: model.id,
      caption: model.caption,
      imageUrl: model.image_url,
      userId: model.user_id,
      userName: model.user_name,
      userAvatar: model.user_avatar,
      createdAt: new Date(model.created_at),
      updatedAt: new Date(model.updated_at),
    }
  }
}
