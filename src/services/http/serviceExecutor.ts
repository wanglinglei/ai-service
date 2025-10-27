import type { ServiceRegistry } from './serviceRegistry';
import type { ServiceExecuteOptions, UnifiedResponse } from './types';

export class ServiceExecutor {
  private registry: ServiceRegistry;

  constructor(registry: ServiceRegistry) {
    this.registry = registry;
  }

  // 执行指定服务
  async executeService<T = any>(
    serviceName: string,
    params: any,
    options: ServiceExecuteOptions = {},
  ): Promise<UnifiedResponse<T>> {
    const service = this.registry.getService(serviceName);

    if (!service) {
      return {
        success: false,
        error: `Service ${serviceName} not found`,
        code: 404,
        serviceName,
      };
    }

    // 参数验证
    if (service.validate && !service.validate(params)) {
      return {
        success: false,
        error: 'Invalid parameters',
        code: 400,
        serviceName,
      };
    }

    try {
      const result = await service.execute(params);

      return {
        success: true,
        data: result as T,
        serviceName,
        code: 200,
      };
    } catch (error: any) {
      console.error(`Service ${serviceName} execution failed:`, error);

      // 如果有降级服务，尝试执行
      if (options.fallbackServices && options.fallbackServices.length > 0) {
        return await this.executeFallbackServices(options.fallbackServices, params, options);
      }

      return {
        success: false,
        error: error.message,
        code: error.code || 500,
        serviceName,
      };
    }
  }
  // 执行功能对应的服务
  async executeFeatureService<T = any>(
    feature: string,
    selectedService: string,
    params: any,
    options: ServiceExecuteOptions = {},
  ): Promise<UnifiedResponse<T>> {
    const availableServices = this.registry.getServicesByFeature(feature);

    if (!availableServices.includes(selectedService)) {
      return {
        success: false,
        error: `Service ${selectedService} is not available for feature ${feature}`,
        code: 400,
        feature,
        serviceName: selectedService,
      };
    }

    // 设置降级服务（排除当前选择的服务）
    const fallbackServices = availableServices.filter((service) => service !== selectedService);

    return await this.executeService(selectedService, params, {
      ...options,
      fallbackServices,
    });
  }

  // 执行降级服务
  private async executeFallbackServices(
    fallbackServices: string[],
    params: any,
    options: ServiceExecuteOptions,
  ): Promise<UnifiedResponse> {
    for (const serviceName of fallbackServices) {
      try {
        console.log(`Trying fallback service: ${serviceName}`);
        const result = await this.executeService(serviceName, params, {
          ...options,
          fallbackServices: [], // 防止无限递归
        });

        if (result.success) {
          console.log(`Fallback service ${serviceName} succeeded`, result);
          return {
            ...result,
            serviceName: `${result.serviceName} (fallback)`,
          };
        }
      } catch (error) {
        console.warn(`Fallback service ${serviceName} failed:`, error);
        // 继续尝试下一个降级服务
      }
    }

    return {
      success: false,
      error: 'All services including fallbacks failed',
      code: 503,
    };
  }

  // 获取功能对应的可用服务列表
  getAvailableServices(feature: string): string[] {
    return this.registry.getServicesByFeature(feature);
  }
}
