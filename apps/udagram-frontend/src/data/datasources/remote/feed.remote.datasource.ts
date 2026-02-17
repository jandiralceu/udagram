import type { AxiosInstance } from 'axios'

import type { CreateFeedRequest } from '@domain/entities'

import type { FeedModel } from '../../models'

export interface IFeedRemoteDataSource {
  getFeeds(): Promise<FeedModel[]>
  getFeedById(feedId: string): Promise<FeedModel>
  createFeed(request: CreateFeedRequest): Promise<FeedModel>
  deleteFeed(feedId: string): Promise<void>
}

export class FeedRemoteDataSource implements IFeedRemoteDataSource {
  readonly #httpClient: AxiosInstance
  readonly #url: string = '/api/v1/feeds'

  constructor(httpClient: AxiosInstance) {
    this.#httpClient = httpClient
  }

  async getFeeds(): Promise<FeedModel[]> {
    const response = await this.#httpClient.get<FeedModel[]>(this.#url)
    return response.data
  }

  async getFeedById(feedId: string): Promise<FeedModel> {
    const response = await this.#httpClient.get<FeedModel>(
      `${this.#url}/${feedId}`
    )
    return response.data
  }

  async createFeed(request: CreateFeedRequest): Promise<FeedModel> {
    const formData = new FormData()
    formData.append('caption', request.caption)
    formData.append('file', request.file)

    const response = await this.#httpClient.post<FeedModel>(
      this.#url,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  }

  async deleteFeed(feedId: string): Promise<void> {
    await this.#httpClient.delete(`${this.#url}/${feedId}`)
  }
}
