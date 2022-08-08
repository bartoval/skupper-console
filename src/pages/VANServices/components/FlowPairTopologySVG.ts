import { drag } from 'd3-drag';
import { forceSimulation, forceCenter, forceManyBody, forceCollide, forceLink } from 'd3-force';
import { select } from 'd3-selection';
import { zoom, zoomTransform, zoomIdentity } from 'd3-zoom';

import siteSVG from '@assets/site.svg';

import {
    VanServicesTopologyDeviceNode,
    VanServicesTopologyLink,
    VanServicesTopologyLinkNormalized,
    VanServicesTopologyNode,
    VanServicesTopologyRouterNode,
    VanServicesTopologyVanService,
} from '../VANServices.interfaces';

const CIRCLE_R = 10;
const ROUTER_IMG_WIDTH = 40;
const ROUTER_IMG_CENTER_X = ROUTER_IMG_WIDTH / 2;
const ARROW_SIZE = 10;

function FlowPairTopologySVG(
    $node: HTMLElement,
    nodes: VanServicesTopologyNode[],
    links: VanServicesTopologyLink[],
    boxWidth: number,
    boxHeight: number,
): VanServicesTopologyVanService {
    const linksWithNodes: VanServicesTopologyLinkNormalized[] = [];
    links.some(function ({ source, target, ...rest }) {
        nodes.some(function (node) {
            if (source === node.identity) {
                linksWithNodes.push({ ...rest, target, source: node });
            }
            if (target === node.identity) {
                linksWithNodes.push({ ...rest, source, target: node });
            }
        });
    });

    const simulation = forceSimulation(nodes)
        .force('center', forceCenter((boxWidth || 2) / 2, (boxHeight || 2) / 3))
        .force('charge', forceManyBody().strength(-60))
        .force('collide', forceCollide(0.9).radius(50).iterations(1))
        .alpha(0.1)
        .alphaMin(0.03)
        .force(
            'link',
            forceLink<VanServicesTopologyNode, VanServicesTopologyLinkNormalized>(linksWithNodes)
                .strength(({ pType }) => (pType ? 1 : 0.1))
                .id(function ({ identity }) {
                    return identity;
                }),
        )
        .on('tick', ticked)
        .on('end', () => {
            nodes.forEach((node) => {
                if (!localStorage.getItem(node.identity)) {
                    node.fx = node.x;
                    node.fy = node.y;

                    localStorage.setItem(
                        node.identity,
                        JSON.stringify({ fx: node.fx, fy: node.fy }),
                    );
                }
            });
        });

    // root
    const svgContainer = select($node)
        .append('svg')
        .attr('id', 'topology-draw-panel')
        .attr('width', boxWidth)
        .attr('height', boxHeight)
        .style('background-color', 'var(--pf-global--BackgroundColor--100)');

    const svgElement = svgContainer.append('g').attr('width', boxWidth).attr('height', boxHeight);
    // arrow
    svgElement
        .append('svg:defs')
        .append('svg:marker')
        .attr('id', 'arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', CIRCLE_R + ARROW_SIZE)
        .attr('markerWidth', ARROW_SIZE)
        .attr('markerHeight', ARROW_SIZE)
        .attr('orient', 'auto-start-reverse')
        .append('svg:path')
        .style('fill', 'gray')
        .attr('d', 'M0,-5L10,0L0,5');

    // links
    svgElement
        .selectAll('.routerLink')
        .data(linksWithNodes)
        .enter()
        .call(function (p) {
            // hidden link line. Creates an area  to trigger mouseover and show the popup
            p.append('line')
                .attr('class', 'routerLink')
                .style('stroke', 'transparent')
                .style('stroke-width', '24px')
                .style('opacity', 0);

            p.append('line')
                .attr('class', 'routerLink')
                .style('stroke', 'var(--pf-global--palette--black-400)')
                .style('stroke-width', '1px')
                .attr('marker-start', () => 'url(#arrow)')
                .attr('marker-end', () => 'url(#arrow)');

            // label
            p.append('text')
                .attr('class', 'routerLinkL')
                .attr('font-size', 14)
                .attr('font-size', function ({ type }) {
                    return type !== 'CONNECTOR' && type !== 'LISTENER' ? 24 : 10;
                })
                .style('fill', 'var(--pf-global--palette--light-blue-500)')
                .text(function ({ type, cost = 0 }) {
                    return type !== 'CONNECTOR' && type !== 'LISTENER' ? cost : '';
                });
        });

    // routers
    const routerNodes = nodes.filter(
        (node) => node.type !== 'flow',
    ) as VanServicesTopologyRouterNode[];

    const svgRouterNodes = svgElement.selectAll('.routerImg').data(routerNodes).enter();

    svgRouterNodes.call(function (p) {
        p.append('image')
            .attr('xlink:href', siteSVG)
            .attr('width', ROUTER_IMG_WIDTH)
            .attr('class', 'routerImg')
            .call(
                drag<SVGImageElement, VanServicesTopologyRouterNode>()
                    .on('start', dragStarted)
                    .on('drag', dragged)
                    .on('end', dragEnded),
            );

        // label
        p.append('text')
            .attr('class', 'routerImg')
            .text(({ name }) => name)
            .attr('font-size', 10);
    });

    // devices
    const deviceNodes = nodes.filter(
        (node) => node.type === 'flow',
    ) as VanServicesTopologyDeviceNode[];

    const svgDeviceNodes = svgElement.selectAll('.devicesImg').data(deviceNodes).enter();

    svgDeviceNodes.call(function (p) {
        // label
        p.append('text')
            .attr('class', 'devicesImgL')
            .text(({ sourcePort, sourceHost }) => `${sourceHost}:${sourcePort}`)
            .attr('font-size', 12);

        p.append('text')
            .attr('class', 'devicesImgBytesL')
            .text(({ bytes }) => bytes)
            .attr('font-size', 12);

        p.append('circle')
            .attr('class', 'devicesImg')
            .attr('r', CIRCLE_R)
            .style('stroke', 'black')
            .style('stroke-width', '1px')
            .style('fill', ({ recType }) =>
                recType === 'CONNECTOR'
                    ? 'var(--pf-global--palette--blue-300)'
                    : 'var(--pf-global--palette--red-100)',
            )
            .call(
                drag<SVGCircleElement, VanServicesTopologyDeviceNode>()
                    .on('start', dragStarted)
                    .on('drag', dragged)
                    .on('end', dragEnded),
            );
    });

    // drag util
    function fixNodes(x?: number, y?: number) {
        svgRouterNodes.each(function (node) {
            if (x !== node.x || y !== node.y) {
                node.fx = node.x;
                node.fy = node.y;
            }
        });

        svgDeviceNodes.each(function (node) {
            if (x !== node.x || y !== node.y) {
                node.fx = node.x;
                node.fy = node.y;
            }
        });
    }

    // drag util
    function dragStarted({ active }: { active: boolean }, node: VanServicesTopologyNode) {
        if (!active) {
            simulation.alphaTarget(0.3).restart();
        }
        node.fx = node.x;
        node.fy = node.y;

        fixNodes(node.x, node.y);
    }

    function dragged({ x, y }: { x: number; y: number }, node: VanServicesTopologyNode) {
        node.fx = x;
        node.fy = y;
    }

    function dragEnded({ active }: { active: boolean }, node: VanServicesTopologyNode) {
        if (!active) {
            simulation.alphaTarget(0);
            simulation.stop();
        }

        node.fx = null;
        node.fy = null;

        localStorage.setItem(node.identity, JSON.stringify({ fx: node.x, fy: node.y }));
    }

    function ticked() {
        const minSvgPosY = 50;
        const minSvgPosX = 50;

        const maxSvgPosX = Number(svgElement.attr('width')) - 50;
        const maxSvgPosY = Number(svgElement.attr('height')) - 50;

        function validatePosition(pos: number, max: number, min: number) {
            if (pos - min < 0) {
                return min;
            }

            if (pos > max) {
                return max;
            }

            return pos;
        }

        svgElement
            .selectAll<SVGSVGElement, VanServicesTopologyNode>('.devicesImg')
            .attr('cx', ({ x }) => validatePosition(x, maxSvgPosX, minSvgPosX))
            .attr('cy', ({ y }) => validatePosition(y, maxSvgPosY, minSvgPosY))
            .attr('x', ({ x }) => validatePosition(x + CIRCLE_R, maxSvgPosX, minSvgPosX))
            .attr('y', ({ y }) => validatePosition(y + CIRCLE_R, maxSvgPosY, minSvgPosY));

        svgElement
            .selectAll<SVGSVGElement, VanServicesTopologyNode>('.devicesImgL')
            .attr('x', ({ x }) => validatePosition(x + CIRCLE_R - 60, maxSvgPosX, minSvgPosX))
            .attr('y', ({ y }) => validatePosition(y + CIRCLE_R + 20, maxSvgPosY, minSvgPosY));

        svgElement
            .selectAll<SVGSVGElement, VanServicesTopologyNode>('.devicesImgBytesL')
            .attr('x', ({ x }) => validatePosition(x + CIRCLE_R - 40, maxSvgPosX, minSvgPosX))
            .attr('y', ({ y }) => validatePosition(y + CIRCLE_R - 30, maxSvgPosY, minSvgPosY));

        svgElement
            .selectAll<SVGSVGElement, VanServicesTopologyNode>('.routerImg')
            .attr('x', ({ x }) => validatePosition(x, maxSvgPosX, minSvgPosX))
            .attr('y', ({ y }) => validatePosition(y, maxSvgPosY, minSvgPosY));

        svgElement
            .selectAll<SVGSVGElement, VanServicesTopologyLinkNormalized>('.routerLink')
            .attr('x1', ({ source }) =>
                validatePosition(
                    (source as VanServicesTopologyRouterNode).x + ROUTER_IMG_CENTER_X,
                    maxSvgPosX,
                    minSvgPosX,
                ),
            )
            .attr('y1', ({ source }) =>
                validatePosition(
                    (source as VanServicesTopologyRouterNode).y + ROUTER_IMG_CENTER_X,
                    maxSvgPosY,
                    minSvgPosY,
                ),
            )
            .attr('x2', ({ target, pType }) =>
                validatePosition(
                    !pType
                        ? (target as VanServicesTopologyRouterNode).x + ROUTER_IMG_CENTER_X
                        : (target as VanServicesTopologyRouterNode).x,
                    maxSvgPosX,
                    minSvgPosX,
                ),
            )
            .attr('y2', ({ target, pType }) =>
                validatePosition(
                    !pType
                        ? (target as VanServicesTopologyRouterNode).y + ROUTER_IMG_CENTER_X
                        : (target as VanServicesTopologyRouterNode).y,
                    maxSvgPosY,
                    minSvgPosY,
                ),
            );

        svgElement
            .selectAll<SVGSVGElement, VanServicesTopologyLinkNormalized>('.routerLinkL')
            .attr('x', ({ target: t, source: s }) => {
                const target = t as VanServicesTopologyRouterNode;
                const source = s as VanServicesTopologyRouterNode;

                if (target.x > source.x) {
                    return validatePosition(
                        source.x + (target.x - source.x) / 2 + ROUTER_IMG_CENTER_X,
                        maxSvgPosX,
                        minSvgPosY,
                    );
                }

                return validatePosition(
                    target.x + (source.x - target.x) / 2 + ROUTER_IMG_CENTER_X,
                    maxSvgPosX,
                    minSvgPosX,
                );
            })
            .attr('y', ({ target: t, source: s }) => {
                const target = t as VanServicesTopologyRouterNode;
                const source = s as VanServicesTopologyRouterNode;

                if (target.y > source.y) {
                    return validatePosition(
                        source.y + (target.y - source.y) / 2 + ROUTER_IMG_CENTER_X,
                        maxSvgPosY,
                        minSvgPosY,
                    );
                }

                return validatePosition(
                    target.y + (source.y - target.y) / 2 + ROUTER_IMG_CENTER_X,
                    maxSvgPosY,
                    minSvgPosY,
                );
            });
    }

    // zoom
    const handleZoom = ({ transform }: { transform: string }) =>
        svgElement.attr('transform', transform);
    const initZoom = zoom<SVGSVGElement, unknown>().scaleExtent([0.5, 6]).on('zoom', handleZoom);

    svgContainer.call(initZoom);

    function reset() {
        const $parent = svgContainer.node();

        if ($parent) {
            svgContainer
                .transition()
                .duration(750)
                .call(
                    initZoom.transform,
                    zoomIdentity,
                    zoomTransform($parent).invert([boxWidth / 2, boxHeight / 2]),
                );
        }
    }

    return Object.assign(svgContainer.node() as SVGElement, {
        zoomIn: () => svgContainer.transition().duration(750).call(initZoom.scaleBy, 1.5),
        zoomOut: () => svgContainer.transition().duration(750).call(initZoom.scaleBy, 0.5),
        reset,
    }) as any;
}

export default FlowPairTopologySVG;
