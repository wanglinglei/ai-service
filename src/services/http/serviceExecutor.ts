import type { ServiceRegistry } from './serviceRegistry';
import type { ServiceExecuteOptions } from './types';
import { Logger } from '@nestjs/common';

export class ServiceExecutor {
  private registry: ServiceRegistry;
  private logger = new Logger(ServiceExecutor.name);

  constructor(registry: ServiceRegistry) {
    this.registry = registry;
  }

  // 执行指定服务
  async executeService<T = any>(
    serviceName: string,
    params: any,
    options: ServiceExecuteOptions = {},
  ): Promise<T> {
    const service = this.registry.getService(serviceName);

    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    // 参数验证
    if (service.validate && !service.validate(params)) {
      throw new Error('Invalid parameters');
    }

    try {
      const result = await service.execute(params);
      return result as T;
    } catch (error: any) {
      this.logger.error(`Service ${serviceName} execution failed:`, error);

      // 如果有降级服务，尝试执行
      if (options.fallbackServices && options.fallbackServices.length > 0) {
        try {
          return await this.executeFallbackServices<T>(
            options.fallbackServices,
            params,
            options,
          );
        } catch {
          // 降级服务也失败，抛出原始错误
          throw error;
        }
      }

      throw error;
    }
  }

  // 执行功能对应的服务
  async executeFeatureService<T = any>(
    feature: string,
    selectedService: string,
    params: any,
    options: ServiceExecuteOptions = {},
  ): Promise<T> {
    const availableServices = this.registry.getServicesByFeature(feature);

    if (!availableServices.includes(selectedService)) {
      throw new Error(
        `Service ${selectedService} is not available for feature ${feature}`,
      );
    }

    // 设置降级服务（排除当前选择的服务）
    const fallbackServices = availableServices.filter(
      (service) => service !== selectedService,
    );

    return await this.executeService(selectedService, params, {
      ...options,
      fallbackServices,
    });
  }

  // 执行降级服务
  private async executeFallbackServices<T = any>(
    fallbackServices: string[],
    params: any,
    options: ServiceExecuteOptions,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (const serviceName of fallbackServices) {
      try {
        this.logger.log(`Trying fallback service: ${serviceName}`);
        const result = await this.executeService(serviceName, params, {
          ...options,
          fallbackServices: [], // 防止无限递归
        });
        this.logger.log(`Fallback service ${serviceName} succeeded`, result);
        return result as T;
      } catch (error) {
        this.logger.warn(`Fallback service ${serviceName} failed:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        // 继续尝试下一个降级服务
      }
    }

    // 所有降级服务都失败
    throw lastError || new Error('All services including fallbacks failed');
  }

  // 获取功能对应的可用服务列表
  getAvailableServices(feature: string): string[] {
    return this.registry.getServicesByFeature(feature);
  }
}
